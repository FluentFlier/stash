"""
Taxonomy Generator for Auto-Folder System

Uses Google Gemini LLM to:
- Analyze raw_topic + summary
- Generate canonical domain/subdomain/leaf labels
- Extract tags and aliases
- Provide confidence scores and rationale
"""

import logging
import json
import re
from typing import Optional, Dict, Any, List

from .config import (
    get_config, 
    TaxonomyConfig, 
    SEED_DOMAINS, 
    ALIAS_MAP,
    FORBIDDEN_LABEL_WORDS
)
from .models import (
    ItemInput,
    TaxonomyCandidate,
    LabelWithAliases
)

# Setup logging
logger = logging.getLogger(__name__)

# Try to import google-generativeai
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-generativeai not installed")


class TaxonomyGenerator:
    """
    Generates canonical taxonomy labels from raw topic and summary.
    Uses Gemini LLM for intelligent categorization.
    """
    
    def __init__(self, config: Optional[TaxonomyConfig] = None):
        """Initialize the taxonomy generator."""
        self.config = config or get_config().taxonomy
        self._configured = False
        self._model = None
    
    def _configure(self) -> None:
        """Configure Gemini API."""
        if self._configured:
            return
        
        if not GEMINI_AVAILABLE:
            raise ImportError("google-generativeai package not installed")
        
        api_key = get_config().gemini_api_key
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in environment")
        
        genai.configure(api_key=api_key)
        self._model = genai.GenerativeModel(self.config.model_name)
        self._configured = True
        logger.info("Taxonomy generator configured")
    
    def _build_seed_domains_reference(self) -> str:
        """Build a reference string of seed domains for the prompt."""
        lines = ["Available top-level domains (prefer these when appropriate):"]
        for domain in SEED_DOMAINS:
            subdomains = [s["label"] for s in domain.get("subdomains", [])]
            lines.append(f"- {domain['label']}: {', '.join(subdomains[:5])}...")
        return "\n".join(lines)
    
    def _build_prompt(self, item: ItemInput) -> str:
        """Build the LLM prompt for taxonomy generation."""
        
        seed_reference = self._build_seed_domains_reference()
        
        prompt = f"""You are a taxonomy classifier for a personal knowledge management app called Stash.

Given content with a raw topic and summary, generate a hierarchical folder classification.

{seed_reference}

## Content to Classify

**Raw Topic:** {item.raw_topic}

**Summary:**
{item.summary[:2000]}

{f"**Source:** {item.source_app}" if item.source_app else ""}
{f"**User Note:** {item.user_note}" if item.user_note else ""}
{f"**Keywords:** {', '.join(item.keywords)}" if item.keywords else ""}

## Your Task

Analyze this content and return a JSON object with the following structure:

```json
{{
  "domain": {{
    "label": "Domain Name",
    "aliases": ["alias1", "alias2"]
  }},
  "subdomain": {{
    "label": "Subdomain Name", 
    "aliases": ["alias1", "alias2"]
  }},
  "leaf_topic": {{
    "label": "Leaf Topic",
    "aliases": ["alias1"],
    "optional": true
  }},
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.85,
  "rationale": "Brief explanation of classification decision"
}}
```

## Classification Rules

1. **Domain (Required):** Broad, stable top-level category
   - Use existing domains when they fit (Health & Fitness, Computer Science, Work, etc.)
   - Max 4 words, Title Case, no punctuation
   - Should be generic enough to contain 100+ items over time

2. **Subdomain (Required):** Second-level category within domain
   - More specific than domain but still broad
   - Examples: "Weight Loss", "Frontend", "Budgeting"
   - Max 4 words, Title Case

3. **Leaf Topic (Optional):** Third-level, only if adds meaningful specificity
   - Set "optional": true if this is marginal
   - Only use for truly recurring topics (e.g., "Rust" under Programming Languages)
   - Leave as null if subdomain is sufficient

4. **Tags:** 3-6 specific keywords for search
   - Include specific terms from the content
   - Include synonyms and related terms

5. **Confidence:** 0.0-1.0 score
   - 0.9+ for clear, unambiguous content
   - 0.7-0.9 for reasonably clear content
   - Below 0.7 for ambiguous content

## Forbidden Words in Labels
Do NOT use these words in domain/subdomain/leaf labels:
- saved, stash, bookmark, like, favorite, share, post, tweet
- Platform names: instagram, tiktok, youtube, twitter, facebook
- Generic: video, image, photo, content, item, thing, misc, other, random

## Examples

Input: raw_topic="calorie deficit", summary="Notes on maintaining a 500 calorie deficit while lifting..."
Output: domain="Health & Fitness", subdomain="Weight Loss", leaf=null, tags=["calorie deficit", "nutrition", "fat loss"]

Input: raw_topic="React hooks", summary="Tutorial on useEffect and useState in React..."
Output: domain="Computer Science", subdomain="Frontend", leaf="React", tags=["react", "hooks", "javascript", "web dev"]

Input: raw_topic="Gift ideas mom", summary="Birthday gift ideas for mom who likes gardening..."  
Output: domain="Shopping & Gifts", subdomain="Gift Ideas", leaf=null, tags=["birthday", "mom", "gardening", "presents"]

Return ONLY valid JSON, no additional text or markdown formatting."""

        return prompt
    
    def _clean_label(self, label: str, max_words: int = 4) -> str:
        """Clean and normalize a label."""
        if not label:
            return ""
        
        # Remove extra whitespace
        label = ' '.join(label.split())
        
        # Remove forbidden words
        words = label.split()
        cleaned_words = [
            w for w in words 
            if w.lower() not in FORBIDDEN_LABEL_WORDS
        ]
        
        # If all words were forbidden, use original
        if not cleaned_words:
            cleaned_words = words
        
        # Limit word count
        if len(cleaned_words) > max_words:
            cleaned_words = cleaned_words[:max_words]
        
        # Title case
        label = ' '.join(cleaned_words)
        label = label.title()
        
        # Remove any remaining punctuation except & and -
        label = re.sub(r'[^\w\s&-]', '', label)
        
        return label.strip()
    
    def _parse_llm_response(self, response_text: str) -> Dict[str, Any]:
        """Parse the LLM response JSON."""
        # Try to extract JSON from response
        response_text = response_text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            # Find the actual JSON content
            lines = response_text.split('\n')
            json_lines = []
            in_json = False
            for line in lines:
                if line.strip().startswith("```") and not in_json:
                    in_json = True
                    continue
                elif line.strip() == "```":
                    break
                elif in_json:
                    json_lines.append(line)
            response_text = '\n'.join(json_lines)
        
        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON response: {e}")
            logger.debug(f"Response text: {response_text[:500]}")
            
            # Try to find JSON object in response
            match = re.search(r'\{[\s\S]*\}', response_text)
            if match:
                try:
                    return json.loads(match.group())
                except:
                    pass
            
            raise ValueError(f"Could not parse LLM response as JSON: {response_text[:200]}")
    
    def _validate_and_build_candidate(
        self, 
        parsed: Dict[str, Any],
        item: ItemInput
    ) -> TaxonomyCandidate:
        """Validate parsed response and build TaxonomyCandidate."""
        
        # Extract domain
        domain_data = parsed.get("domain", {})
        if isinstance(domain_data, str):
            domain_data = {"label": domain_data, "aliases": []}
        
        domain_label = self._clean_label(
            domain_data.get("label", "Uncategorized"),
            self.config.max_domain_words
        )
        
        # Check if domain maps to existing via alias
        if domain_label.lower() in ALIAS_MAP:
            canonical = ALIAS_MAP[domain_label.lower()]
            if "/" not in canonical:  # It's a domain alias
                domain_label = canonical
        
        domain = LabelWithAliases(
            label=domain_label,
            aliases=domain_data.get("aliases", [])
        )
        
        # Extract subdomain
        subdomain_data = parsed.get("subdomain", {})
        if isinstance(subdomain_data, str):
            subdomain_data = {"label": subdomain_data, "aliases": []}
        
        subdomain_label = self._clean_label(
            subdomain_data.get("label", "General"),
            self.config.max_subdomain_words
        )
        
        subdomain = LabelWithAliases(
            label=subdomain_label,
            aliases=subdomain_data.get("aliases", [])
        )
        
        # Extract leaf topic (optional)
        leaf_topic = None
        leaf_data = parsed.get("leaf_topic")
        if leaf_data:
            if isinstance(leaf_data, str):
                leaf_data = {"label": leaf_data, "aliases": [], "optional": True}
            
            leaf_label = self._clean_label(
                leaf_data.get("label", ""),
                self.config.max_leaf_words
            )
            
            if leaf_label:
                leaf_topic = LabelWithAliases(
                    label=leaf_label,
                    aliases=leaf_data.get("aliases", []),
                    optional=leaf_data.get("optional", True)
                )
        
        # Extract tags
        tags = parsed.get("tags", [])
        if not isinstance(tags, list):
            tags = []
        
        # Clean tags
        tags = [t.lower().strip() for t in tags if isinstance(t, str)]
        tags = [t for t in tags if t and t.lower() not in FORBIDDEN_LABEL_WORDS]
        
        # Add raw topic as tag if not already present
        if item.raw_topic:
            raw_topic_clean = item.raw_topic.lower().strip()
            if raw_topic_clean not in tags:
                tags.append(raw_topic_clean)
        
        # Extract confidence
        confidence = parsed.get("confidence", 0.7)
        if not isinstance(confidence, (int, float)):
            confidence = 0.7
        confidence = max(0.0, min(1.0, float(confidence)))
        
        # Extract rationale
        rationale = parsed.get("rationale", "")
        if not isinstance(rationale, str):
            rationale = str(rationale)
        
        return TaxonomyCandidate(
            domain=domain,
            subdomain=subdomain,
            leaf_topic=leaf_topic,
            tags=tags[:10],  # Limit to 10 tags
            confidence=confidence,
            rationale=rationale[:500]  # Limit rationale length
        )
    
    def generate(self, item: ItemInput) -> TaxonomyCandidate:
        """
        Generate taxonomy candidate for an item.
        
        Args:
            item: Input item with raw_topic and summary
            
        Returns:
            TaxonomyCandidate with domain/subdomain/leaf/tags
        """
        # Check for empty input
        if not item.raw_topic and not item.summary:
            logger.warning("Empty input - using default taxonomy")
            return TaxonomyCandidate(
                domain=LabelWithAliases(label="Uncategorized", aliases=[]),
                subdomain=LabelWithAliases(label="General", aliases=[]),
                leaf_topic=None,
                tags=[],
                confidence=0.3,
                rationale="No content provided for classification"
            )
        
        # Try alias map first for simple topics
        raw_topic_lower = item.raw_topic.lower().strip() if item.raw_topic else ""
        if raw_topic_lower in ALIAS_MAP:
            canonical_path = ALIAS_MAP[raw_topic_lower]
            parts = canonical_path.split("/")
            
            if len(parts) >= 2:
                logger.info(f"Quick match via alias map: {raw_topic_lower} -> {canonical_path}")
                return TaxonomyCandidate(
                    domain=LabelWithAliases(label=parts[0], aliases=[raw_topic_lower]),
                    subdomain=LabelWithAliases(label=parts[1], aliases=[]),
                    leaf_topic=None,
                    tags=[raw_topic_lower],
                    confidence=0.95,
                    rationale="Matched via alias map"
                )
        
        # Configure and call LLM
        self._configure()
        
        prompt = self._build_prompt(item)
        
        try:
            logger.info(f"Generating taxonomy for: {item.raw_topic[:50]}...")
            
            response = self._model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=self.config.temperature,
                    response_mime_type="application/json"
                )
            )
            
            response_text = response.text
            logger.debug(f"LLM response: {response_text[:500]}")
            
            # Parse and validate
            parsed = self._parse_llm_response(response_text)
            candidate = self._validate_and_build_candidate(parsed, item)
            
            logger.info(
                f"Generated taxonomy: {candidate.domain.label}/{candidate.subdomain.label}"
                f"{('/' + candidate.leaf_topic.label) if candidate.leaf_topic else ''}"
                f" (confidence: {candidate.confidence:.2f})"
            )
            
            return candidate
            
        except Exception as e:
            logger.error(f"Error generating taxonomy: {e}")
            
            # Fallback to basic classification
            return self._fallback_classification(item)
    
    def _fallback_classification(self, item: ItemInput) -> TaxonomyCandidate:
        """
        Fallback classification when LLM fails.
        Uses keyword matching against seed domains.
        """
        logger.info("Using fallback classification")
        
        text_to_match = f"{item.raw_topic} {item.summary}".lower()
        
        best_domain = None
        best_subdomain = None
        best_score = 0
        
        for domain in SEED_DOMAINS:
            # Check domain aliases
            domain_score = sum(1 for alias in domain.get("aliases", []) if alias in text_to_match)
            
            if domain_score > best_score:
                best_score = domain_score
                best_domain = domain["label"]
                best_subdomain = "General"
            
            # Check subdomain aliases
            for subdomain in domain.get("subdomains", []):
                sub_score = domain_score + sum(
                    1 for alias in subdomain.get("aliases", []) 
                    if alias in text_to_match
                )
                
                if sub_score > best_score:
                    best_score = sub_score
                    best_domain = domain["label"]
                    best_subdomain = subdomain["label"]
        
        # Default if no match
        if not best_domain:
            best_domain = "Personal"
            best_subdomain = "Ideas"
        
        # Extract basic tags from raw topic
        tags = [w.lower() for w in item.raw_topic.split() if len(w) > 2]
        
        return TaxonomyCandidate(
            domain=LabelWithAliases(label=best_domain, aliases=[]),
            subdomain=LabelWithAliases(label=best_subdomain, aliases=[]),
            leaf_topic=None,
            tags=tags[:5],
            confidence=0.5,
            rationale="Fallback classification via keyword matching"
        )
    
    def generate_batch(self, items: List[ItemInput]) -> List[TaxonomyCandidate]:
        """
        Generate taxonomy candidates for multiple items.
        
        Args:
            items: List of input items
            
        Returns:
            List of TaxonomyCandidate objects
        """
        candidates = []
        
        for item in items:
            try:
                candidate = self.generate(item)
                candidates.append(candidate)
            except Exception as e:
                logger.error(f"Error generating taxonomy for item {item.item_id}: {e}")
                # Add fallback for failed items
                candidates.append(self._fallback_classification(item))
        
        return candidates


# ============================================
# Factory Function
# ============================================

_taxonomy_generator: Optional[TaxonomyGenerator] = None


def get_taxonomy_generator() -> TaxonomyGenerator:
    """Get the global taxonomy generator instance."""
    global _taxonomy_generator
    if _taxonomy_generator is None:
        _taxonomy_generator = TaxonomyGenerator()
    return _taxonomy_generator
