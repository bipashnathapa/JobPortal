import spacy
import re

# Load the small English model
nlp = spacy.load("en_core_web_sm")

STRONG_VERBS = {
    "achieved", "improved", "trained", "mentored", "managed", "created", 
    "resolved", "volunteered", "influenced", "increased", "decreased", 
    "negotiated", "launched", "optimized", "built", "developed", "designed", 
    "led", "directed", "coordinated", "delivered", "spearheaded", "executed", 
    "implemented", "generated", "saved", "won", "collaborated", "facilitated",
    "streamlined", "orchestrated", "engineered", "founded"
}

EDU_KEYWORDS = {
    "university", "college", "bachelor", "master", "phd", "degree", 
    "b.s.", "b.a.", "education", "institute", "school", "academy"
}

def _length_points(word_count: int) -> float:
    """Evaluates if the resume is a professional length (approx 1-2 pages). Max 15 pts."""
    w = max(0, word_count)
    if w < 120:
        return 15.0 * (w / 120.0) * 0.35
    if w < 350:
        return 5.25 + 9.75 * ((w - 120) / 230.0)
    if w <= 750:
        return 15.0
    return max(4.0, 15.0 - 11.0 * min(1.0, (w - 750) / 750.0))

def analyze_with_nlp(text: str) -> float:
    text_lower = text.lower()
    
    # 1. Initialize NLP Doc
    doc = nlp(text or "")
    word_count = len([t for t in doc if not t.is_punct and not t.is_space])

    # 2. Contact Information Detection (15 pts)
    # Basic email regex
    has_email = bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text))
    # Basic phone regex (allows international, parentheses, dashes)
    has_phone = bool(re.search(r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text))
    
    contact_pts = 0.0
    if has_email: contact_pts += 7.5
    if has_phone: contact_pts += 7.5

    # 3. Quantifiable Metrics (15 pts)
    # Looking for digits or percentage signs.
    number_hits = len(re.findall(r"\b\d+\b|\d+%", text))
    # Target 5 quantifiable metrics for max points
    metrics_pts = 15.0 * min(1.0, number_hits / 5.0)

    # 4. Structure Analysis (NER & Keywords) (15 pts)
    org_hits = len(set([ent.text.lower() for ent in doc.ents if ent.label_ == "ORG"]))
    date_hits = len(set([ent.text.lower() for ent in doc.ents if ent.label_ == "DATE"]))
    has_edu = any(kw in text_lower for kw in EDU_KEYWORDS)
    
    # Orgs (5), Dates (5), Edu (5)
    org_pts = 5.0 * min(1.0, org_hits / 3.0) 
    date_pts = 5.0 * min(1.0, date_hits / 3.0)
    edu_pts = 5.0 if has_edu else 0.0
    structure_pts = org_pts + date_pts + edu_pts

    # 5. Action-Oriented Language (Strong Verbs) (20 pts)
    # Count unique strong verbs used
    verb_lemmas = set(t.lemma_.lower() for t in doc if t.pos_ == "VERB")
    strong_verb_hits = len(verb_lemmas.intersection(STRONG_VERBS))
    # Target 8 unique strong verbs for max points
    verb_pts = 20.0 * min(1.0, strong_verb_hits / 8.0)

    # 6. Domain-Agnostic "Skill" Detection (Noun Chunking) (20 pts)
    noun_phrases = set([chunk.text.lower() for chunk in doc.noun_chunks if len(chunk.text.split()) > 1])
    concept_count = len(noun_phrases)
    # Target 12 unique professional phrases for max points
    concept_pts = 20.0 * min(1.0, concept_count / 12.0)
    
    # Readability (Length): 15 pts
    len_pts = _length_points(word_count)

    total = contact_pts + metrics_pts + structure_pts + verb_pts + concept_pts + len_pts
    return round(min(100.0, max(0.0, total)), 1)