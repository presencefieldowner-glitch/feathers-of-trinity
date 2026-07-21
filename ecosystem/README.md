# ecosystem

Structural placeholder scaffold for the Presence Technology Ecosystem tree
documented in `../ECOSYSTEM.md`, credited to Joseph Michael Rounsaville.

## What this is -- and isn't

Every branch of the ecosystem tree that isn't already real code elsewhere in
this repo (Runtime Services in `core/runtime-kernel`, the two Presence
Engine pieces in `presence/`) gets one module here, with one method per
sub-component named in the tree. **Almost every one of those methods raises
`NotImplementedError`** -- the one exception is `laketiticaca_interpreter.py`
(see below). Nothing else in this directory performs real reasoning, math,
audio processing, AI, visualization, security, tooling, or OS/platform work
-- it exists so the full tree has a 1:1 code location to fill in later, not
to claim any of it works today.

`tests/test_scaffold.py` enforces this: it walks every fully-placeholder
class in this package and asserts every public method still raises
`NotImplementedError`, plus a dedicated check that
`LakeTiticacaInterpreter`'s six remaining placeholder stages still do too.
If you implement one of these for real, the relevant test will fail on
purpose -- update it deliberately when you do, as a checkpoint to review
what "real" means for that piece before it ships.

### The one real exception: `laketiticaca_interpreter.py`

`LakeTiticacaInterpreter.observation()`, `.interpretation()`, and
`.response_construction()` -- chained by `.teach()` -- are small, real,
rule-based logic: plain regex/string rules that catch a few things (doubled
spaces, a missing capital letter, an accidentally repeated word) and
construct a short corrected-text reply. It's an original, from-scratch
reconstruction of the general "interpret input, understand what's off,
teach a correction" idea, built entirely with this project's own code --
not connected to, derived from, or claiming parity with any third-party
language-learning product. Run `python demo.py` from this directory to see
it work. The other six stages (`alignment`, `reasoning`,
`knowledge_retrieval`, `relationship_mapping`, `inference`, `evolution`)
are still `NotImplementedError` placeholders.

Each instance also keeps a small **in-process history** (`self._issue_counts`,
readable via `.history()`) of which issue types it has flagged before, so a
repeat within the same session gets an extra "you've made this mistake
before" note in `teach()`'s reply. This is plain per-instance dict state,
scoped to one `LakeTiticacaInterpreter` object and reset by creating a new
one -- not persisted anywhere, not shared across instances, and not a claim
of general awareness or of anything resembling a real AI model.

## Security -- read this before touching `security.py`

`SecurityScaffold` is not a security system. None of its methods perform
real encryption, identity checks, authentication, or trust evaluation. The
only real authentication in this repository is the JWT-based flow in
`services/api/src/modules/auth` (documented in `CLAUDE.md`). Do not wire
`SecurityScaffold` into anything that needs real protection.

## Hardware-adjacent branches

`visualization.py` (Drone Operations, Satellite View) and `presence_os.py`
(Robotics, XR, Distributed Presence Network) name physical or networked
systems this repository has no connection to. Their placeholder methods are
no different from the rest -- they raise `NotImplementedError` rather than
simulating hardware or a network that doesn't exist here.

## Layout

```
laketiticaca_interpreter.py    Observation, Interpretation, Response Construction (real,
                                see above); Alignment, Reasoning, Knowledge Retrieval,
                                Relationship Mapping, Inference, Evolution (placeholder)
demo.py                        Runs LakeTiticacaInterpreter.teach() end to end
presence_engine_extended.py    The 8 Presence Engine sub-components not covered by
                                presence/ (Presence Runtime and Intent Engine are real)
sage_framework.py              Algebra/Geometry/Mathematical SAGE, Calculation Engine,
                                Symbolic Mathematics, Optimization, Scientific Computing,
                                Prediction Engine
quantum_audio.py               Spatial Audio, Beamforming, Resonance Engine, Frequency
                                Mapping, Dynamic Positioning, Sound Field Simulation,
                                Presence Audio, 360-degree Audio Runtime
intelligence_layer.py          Natural Language, Semantic Memory, Knowledge Graph,
                                Reasoning, Planning, Autonomous Agents, Code Generation,
                                Research Assistant
visualization.py               Holographic UI, Reality Dashboard, 3D Maps, Drone
                                Operations, Satellite View, Digital Twin, Graph Engine,
                                Live Analytics
security.py                    SecurityScaffold -- see disclaimer above
developer_platform.py          HTML/Software/API Generator, SDK, CLI, Templates,
                                Testing, Deployment
presence_os.py                 Desktop, Mobile, Cloud, Browser, Embedded, Robotics, XR,
                                Distributed Presence Network
```

## Running the tests

```bash
cd ecosystem
pytest
```

No dependencies beyond `pytest` and the Python standard library.
