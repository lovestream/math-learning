"""Second arithmetic implementation for the closed review: AST + exact Fraction.

Inputs are the manually authored prompt-derived relations, NOT expected answers.
Does not access server data or execute an expression with eval.
"""
import ast
import json
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def calculate(text):
    def visit(node):
        if isinstance(node, ast.Constant) and type(node.value) in (int, float):
            return Fraction(str(node.value))
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            return visit(node.operand) * (1 if isinstance(node.op, ast.UAdd) else -1)
        if isinstance(node, ast.BinOp):
            left, right = visit(node.left), visit(node.right)
            if isinstance(node.op, ast.Add):
                return left + right
            if isinstance(node.op, ast.Sub):
                return left - right
            if isinstance(node.op, ast.Mult):
                return left * right
            if isinstance(node.op, ast.Div):
                return left / right
        raise ValueError("Only arithmetic constants are allowed")
    return visit(ast.parse(text, mode="eval").body)


def main():
    source = ROOT / "docs/review/final-task-review/independent-relations.json"
    register = json.loads(source.read_text())
    for row in register["rows"]:
        values = [calculate(part) for part in row["parts"]]
        if any(value != values[0] for value in values):
            raise AssertionError((row["taskId"], row["equation"], values))
    # Remainder, inverse process, geometric boundary, calendar and finite enumeration
    # use different representations to avoid treating a reference equation as proof.
    assert divmod(47, 6) == (7, 5) and 6 * 6 + 11 == 47 and 11 >= 6
    assert (44 // 4 - 7) == 4 and (7 + 4) * 4 == 44 and 7 + 4 * 4 == 23
    assert {(b * 100 + 57) * 3 for b in (1, 2)} == {471, 771}
    assert all((b * 100 + 57) * 3 >= 1000 for b in range(3, 10))
    assert sum(length // 10 for length in (79, 79, 90)) == 23
    assert 40 + 5 * (40 - 2 * 5) == 190
    assert {abs(a - 5) for a in (-3, 3)} == {8, 2}
    assert sum((5, 5, 10, 10, 10, 20)) == 60
    assert sum((9, 9, 19, 19, 19, 25)) == 100
    from datetime import datetime, timedelta
    assert (datetime(2028, 2, 28, 9) + timedelta(days=3)).date().isoformat() == "2028-03-02"
    assert (datetime(2027, 2, 28, 9) + timedelta(days=3)).date().isoformat() == "2027-03-03"
    print(f"Exact Fraction cross-check: {len(register['rows'])} authored equalities + 10 independent boundary assertions passed")


if __name__ == "__main__":
    main()
