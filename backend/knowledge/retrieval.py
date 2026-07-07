import json
from pathlib import Path
from functools import lru_cache


CHUNKS_PATH = Path(__file__).parent / "chunks.json"


@lru_cache(maxsize=1)
def load_chunks() -> list[dict]:
    """
    Load the curated ROCm knowledge base.

    Cached so we don't read JSON
    for every request.
    """

    with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def tokenize(text: str) -> set[str]:
    """
    Very simple tokenizer.

    Lowercase
    Split by whitespace
    """

    return {
        word.strip(".,()[]{}:;!?").lower()
        for word in text.split()
        if word.strip()
    }


def score_chunk(question_tokens: set[str], chunk: dict) -> int:
    """
    Calculate a simple keyword score.
    """

    score = 0

    keywords = {
        k.lower()
        for k in chunk.get("keywords", [])
    }

    score += len(question_tokens & keywords) * 5

    title_tokens = tokenize(chunk["title"])
    score += len(question_tokens & title_tokens) * 4

    question = tokenize(chunk["question"])
    score += len(question_tokens & question) * 2

    answer = tokenize(chunk["answer"])
    score += len(question_tokens & answer)

    return score


def retrieve(
    question: str,
    top_k: int = 5,
) -> list[dict]:
    """
    Return Top-K relevant knowledge chunks.
    """

    chunks = load_chunks()

    question_tokens = tokenize(question)

    ranked = []

    for chunk in chunks:

        score = score_chunk(
            question_tokens,
            chunk,
        )

        if score > 0:
            ranked.append(
                (score, chunk)
            )

    ranked.sort(
        key=lambda x: x[0],
        reverse=True,
    )

    return [
    chunk
    for score, chunk in ranked[:top_k]
    if score >= 3
    ]