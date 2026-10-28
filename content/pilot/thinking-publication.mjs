import { createHash } from "node:crypto";
// Explicit editorial release. This is a technical/editorial review, not Kevin's mastery
// or a claim that a human parent has completed teaching acceptance.
const approved = [
  {
    id: "G3-U01-TH1",
    contentHash:
      "ad55e925921a12793f72975fb9739c172bd21650efbcdebad9e3d7a1272662e6",
  },
  {
    id: "G3-U02-TH1",
    contentHash:
      "1baafa667488563ff26905fb06f21c8a794bb6018e6a24e10faf5610a3c48a2a",
  },
  {
    id: "G3-U03-TH1",
    contentHash:
      "0a1010f2af1c6864cfb86813a6011bf565e49c2d0e098ebb5e0219d33082c05c",
  },
  {
    id: "G3-UP01-TH1",
    contentHash:
      "1fcf81f14c91ae9b48cf3d479fe2d38ab087c7896836098134a6ee64b21701a1",
  },
  {
    id: "G3-U04-TH1",
    contentHash:
      "ed47b9e975c473fb80715c6824a0cf3a2b34bba6885d689180030d544627a827",
  },
  {
    id: "G3-UP02-TH1",
    contentHash:
      "80c634bd5a6c066295fcbc8212bae37784cf48e691709eb5aaadbdb0f7a3be65",
  },
  {
    id: "G3-U05-TH1",
    contentHash:
      "4c3d1cd3383e0ea41b65ea1063647c9d4b1bb1c83a92feb3c3e1f474c37a21c4",
  },
  {
    id: "G3-U06-TH1",
    contentHash:
      "cb5c7d18e5f5b12ed9f9f8e5f1c75faf4d51edcb308dc6101d80991adbd616a3",
  },
  {
    id: "G3-U07-TH1",
    contentHash:
      "0a784e44569c5289489d2a082e960f7d25cac9ed209e5773e0bbd93b3b8d4462",
  },
  {
    id: "G3-L01-TH1",
    contentHash:
      "8450707a64761d3fb93f39b46a9d9e1c1523ffe53924aefa1b7b30677c9e413f",
  },
  {
    id: "G3-L02-TH1",
    contentHash:
      "889a03547a50c2cae9ddc651e2f5aeb5d0c1c708bedf0ccdbc0a6716e1e9137a",
  },
  {
    id: "G3-L03-TH1",
    contentHash:
      "eab7e03d0ba5fa3c745be94758b9a84e504152f8fec7e53df0b4184116372789",
  },
  {
    id: "G3-L04-TH1",
    contentHash:
      "b108f5317cc98af31f19a7cf1bdada51ce9fe73985d2e3346c0a39344ae82d19",
  },
  {
    id: "G3-L05-TH1",
    contentHash:
      "e32207aa339f474577f2659217b9dd765c027bc1d156b45e3c0d1f3b570d5652",
  },
  {
    id: "G3-LP01-TH1",
    contentHash:
      "64e0a8dbcb9480aff5dd67b1306996ff5b4c6aa13eb7e4b72951112b2db615b1",
  },
  {
    id: "G3-L06-TH1",
    contentHash:
      "2486c2bc79efb72362e38f8ebd72b17a1cf52de4e8f6dded883995fdb76bdfac",
  },
  {
    id: "G3-L07-TH1",
    contentHash:
      "6dbaa02a8262a6817eba47c99c24b32ad5e675ae18f56de01e2a0414a1e803b3",
  },
];
export const publicationManifest = Object.freeze(
  approved.map((row) =>
    Object.freeze({
      ...row,
      teachingReview: "editorial-reviewed-awaiting-parent-trial",
      mathReview: "checked",
      figureReview: "condition-figure-checked",
      figureVersion: "condition-figure.v1",
      version: "thinking.2026-10-08.1",
      batch: "grade3-transfer-01",
      publishedAt: "2026-10-08",
      reviewSource: "repository-editorial-review",
      studentMastery: "not-assessed",
    }),
  ),
);
export const contentFingerprint = (t) =>
  createHash("sha256")
    .update(
      JSON.stringify([
        t.id,
        t.question,
        t.answer,
        t.reason,
        t.solutionSteps,
        t.hints,
        t.applicability,
        t.thinkingEvidence,
      ]),
    )
    .digest("hex");
export const isApprovedThinkingCard = (id, card) =>
  publicationManifest.some(
    (r) =>
      r.id === id &&
      card &&
      contentFingerprint(card) === r.contentHash &&
      r.mathReview === "checked" &&
      r.figureReview === "condition-figure-checked" &&
      r.teachingReview === "editorial-reviewed-awaiting-parent-trial",
  );
