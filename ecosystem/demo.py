"""Demo of the one real, working piece of ecosystem/: the LakeTiticaca
Interpreter's observation -> interpretation -> response construction
pipeline (LakeTiticacaInterpreter.teach()). Everything else in this
package is still an explicit NotImplementedError placeholder -- see
README.md.

Run with: python demo.py  (from the ecosystem/ directory)
"""

from laketiticaca_interpreter import LakeTiticacaInterpreter


def main() -> None:
    interpreter = LakeTiticacaInterpreter()

    for text in ["this  is a test test.", "This is fine."]:
        print(f"input: {text!r}")
        print(f"reply: {interpreter.teach(text)}")
        print()


if __name__ == "__main__":
    main()
