import spacy

# Load the small English model
nlp = spacy.load("en_core_web_sm")

def _length_points(word_count: int) -> float:
    """Evaluates if the resume is a professional length (approx 1–2 pages)."""
    w = max(0, word_count)
    if w < 120:
        return 30.0 * (w / 120.0) * 0.35
    if w < 350:
        return 10.5 + 19.5 * ((w - 120) / 230.0)
    if w <= 750:
        return 30.0
    return max(8.0, 30.0 - 22.0 * min(1.0, (w - 750) / 750.0))

def analyze_with_nlp(text: str) -> float:
    # 1. Initialize NLP Doc
    doc = nlp(text or "")
    word_count = len([t for t in doc if not t.is_punct and not t.is_space])

    # 2. Structure Analysis (NER)
    # Counts unique Organizations and Dates to verify professional history
    org_hits = len(set([ent.text.lower() for ent in doc.ents if ent.label_ == "ORG"]))
    date_hits = len(set([ent.text.lower() for ent in doc.ents if ent.label_ == "DATE"]))

    # 3. Action-Oriented Language (POS Tagging)
    # Verbs indicate achievements; we target about 15-20 for a student CV
    verb_count = sum(1 for t in doc if t.pos_ == "VERB")

    # 4. Domain-Agnostic "Skill" Detection (Noun Chunking)
   
    # This detects professional concepts in ANY field.
    noun_phrases = set([chunk.text.lower() for chunk in doc.noun_chunks if len(chunk.text.split()) > 1])
    concept_count = len(noun_phrases)

    
    # Structure (Organizations): 15 pts
    org_pts = 15.0 * min(1.0, org_hits / 3.0) 
    
    # Timeline (Dates): 10 pts
    date_pts = 10.0 * min(1.0, date_hits / 3.0)
    
    # Impact (Verbs): 25 pts (Targeting 20 verbs for max points)
    verb_pts = 25.0 * min(1.0, verb_count / 20.0)
    
    # Expertise (Noun Concepts): 20 pts (Targeting 12 unique professional phrases)
    concept_pts = 20.0 * min(1.0, concept_count / 12.0)
    
    # Readability (Length): 30 pts
    len_pts = _length_points(word_count)

    total = org_pts + date_pts + verb_pts + concept_pts + len_pts
    return round(min(100.0, max(0.0, total)), 1)