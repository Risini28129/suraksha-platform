"""Versioned model interface. Development rules are NOT a trained classifier."""
from dataclasses import dataclass
from typing import Protocol
import unicodedata

@dataclass
class Analysis:
    classification: str
    riskLevel: str
    confidence: float | None
    language: str
    modelVersion: str
    validationStatus: str
    explanation: str

class Analyzer(Protocol):
    def analyze(self, text: str, language: str) -> Analysis: ...

def preprocess(text: str) -> str:
    # Preserve Sinhala/Tamil combining marks and code mixing. No destructive transliteration.
    return ' '.join(unicodedata.normalize('NFC', text).split())

def detect_script(text: str) -> str:
    if any('\u0d80' <= c <= '\u0dff' for c in text): return 'si'
    if any('\u0b80' <= c <= '\u0bff' for c in text): return 'ta'
    return 'en'

class DevelopmentAnalyzer:
    def analyze(self, text: str, language: str) -> Analysis:
        normalized = preprocess(text)
        language = detect_script(normalized) if language == 'auto' else language
        match = any(word in normalized.casefold() for word in ['blackmail', 'kill you', 'hurt you', 'regret this', 'regret it', 'you will regret', 'you need to be regret'])
        return Analysis('DEVELOPMENT_FLAG' if match else 'UNASSESSED', 'REVIEW_REQUIRED', None, language,
                        'development-rules-v1', 'NON_VALIDATED_DEVELOPMENT',
                        'An illustrative English phrase matched. This is not validated threat detection.' if match else
                        'No validated multilingual model is installed. Absence of a development flag does not indicate safety.')

class ArtifactAnalyzer:
    """Deployment boundary for a trained TF-IDF baseline or multilingual transformer."""
    def __init__(self, artifact: str):
        raise RuntimeError(f'Trained model loading is not configured: {artifact}')
