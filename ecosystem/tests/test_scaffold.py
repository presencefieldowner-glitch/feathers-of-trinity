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

SCAFFOLD_CLASSES = [
    LakeTiticacaInterpreter,
    PresenceEngineExtended,
    SageFramework,
    QuantumAudio,
    IntelligenceLayer,
    Visualization,
    SecurityScaffold,
    DeveloperPlatform,
    PresenceOS,
]


def _public_methods(cls):
    return [
        name
        for name, _ in inspect.getmembers(cls, predicate=inspect.isfunction)
        if not name.startswith("_")
    ]


def test_every_scaffold_class_lists_at_least_one_method():
    for cls in SCAFFOLD_CLASSES:
        assert _public_methods(cls), f"{cls.__name__} should list at least one placeholder method"


def test_every_scaffold_method_is_an_explicit_placeholder():
    for cls in SCAFFOLD_CLASSES:
        instance = cls()
        for name in _public_methods(cls):
            method = getattr(instance, name)
            try:
                method()
            except NotImplementedError:
                continue
            raise AssertionError(f"{cls.__name__}.{name} should raise NotImplementedError")
