import inspect

from developer_platform import DeveloperPlatform
from intelligence_layer import IntelligenceLayer
from laketiticaca_interpreter import LakeTiticacaInterpreter
from presence_engine_extended import PresenceEngineExtended
from presence_os import PresenceOS
from quantum_audio import QuantumAudio
from sage_framework import SageFramework
from security import SecurityScaffold
from visualization import Visualization

FULLY_SCAFFOLDED_CLASSES = [
    PresenceEngineExtended,
    SageFramework,
    QuantumAudio,
    IntelligenceLayer,
    Visualization,
    SecurityScaffold,
    DeveloperPlatform,
    PresenceOS,
]

# LakeTiticacaInterpreter is partial: these six stages are still explicit
# placeholders; observation/interpretation/response_construction/teach are
# real (see laketiticaca_interpreter.py) and are exercised separately below.
LAKETITICACA_PLACEHOLDER_METHODS = [
    "alignment",
    "reasoning",
    "knowledge_retrieval",
    "relationship_mapping",
    "inference",
    "evolution",
]


def _public_methods(cls):
    return [
        name
        for name, _ in inspect.getmembers(cls, predicate=inspect.isfunction)
        if not name.startswith("_")
    ]


def test_every_fully_scaffolded_class_lists_at_least_one_method():
    for cls in FULLY_SCAFFOLDED_CLASSES:
        assert _public_methods(cls), f"{cls.__name__} should list at least one placeholder method"


def test_every_fully_scaffolded_method_is_an_explicit_placeholder():
    for cls in FULLY_SCAFFOLDED_CLASSES:
        instance = cls()
        for name in _public_methods(cls):
            method = getattr(instance, name)
            try:
                method()
            except NotImplementedError:
                continue
            raise AssertionError(f"{cls.__name__}.{name} should raise NotImplementedError")


def test_laketiticaca_remaining_stages_are_still_explicit_placeholders():
    interpreter = LakeTiticacaInterpreter()
    for name in LAKETITICACA_PLACEHOLDER_METHODS:
        method = getattr(interpreter, name)
        try:
            method()
        except NotImplementedError:
            continue
        raise AssertionError(f"LakeTiticacaInterpreter.{name} should raise NotImplementedError")


def test_laketiticaca_teach_is_real_and_actually_corrects_text():
    interpreter = LakeTiticacaInterpreter()

    reply = interpreter.teach("this  is a test test.")
    assert reply == (
        'Suggested correction: "This is a test." '
        "(collapsed repeated spaces into one; capitalized the start of a sentence; "
        "removed an accidentally repeated word)"
    )

    clean_reply = interpreter.teach("This is fine.")
    assert clean_reply == 'Looks good: "This is fine."'
