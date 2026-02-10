def _get_risk_level(c):
    return (c.get("risk_level") or "Low").strip()

def calculate_score(clauses):
    if not isinstance(clauses, list):
        return 100, {"financial": 100, "legal": 100, "control": 100}
    score = 100
    financial, legal, control = 100, 100, 100
    payment_cats = {"Payment", "Payment & compensation", "Liability", "Liability & indemnification"}
    legal_cats = {"Arbitration", "Arbitration & jurisdiction", "Liability", "Liability & indemnification"}
    control_cats = {"Termination", "IP", "Intellectual property ownership", "Intellectual property"}
    for c in clauses:
        lvl = _get_risk_level(c)
        cat = (c.get("category") or "Other").strip()
        if lvl == "High":
            score -= 15
        elif lvl == "Medium":
            score -= 7
        if cat in payment_cats:
            if lvl == "High": financial = min(financial, 70)
            elif lvl == "Medium": financial = min(financial, 85)
        if cat in legal_cats:
            if lvl == "High": legal = min(legal, 70)
            elif lvl == "Medium": legal = min(legal, 85)
        if cat in control_cats:
            if lvl == "High": control = min(control, 70)
            elif lvl == "Medium": control = min(control, 85)
    score = max(score, 0)
    return score, {"financial": financial, "legal": legal, "control": control}
