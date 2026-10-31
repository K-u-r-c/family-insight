---
description: How Family Insight works out how two people are related – blood lines through the lowest common ancestors, partners, in-laws and step relationships – as data for the language-specific names.
---

# Relationship calculator

`findRelationships(tree, a, b)` in `src/core/kinship/kinship.ts` answers "what is `b` to `a`?"
with **every** relevant relationship, shortest first, as structured descriptors. Turning a
descriptor into words is the job of the per-language namers (`src/core/kinship/terms/`).

## Descriptors

| `kind`       | Meaning                                                                 | Main fields                                                  |
| ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| `self`       | the same person                                                         | –                                                            |
| `direct`     | ancestor (`down` 0) or descendant (`up` 0)                              | `up`, `down`, `lineage`, `side`                              |
| `collateral` | sibling, aunt/uncle, nephew/niece, cousin …                             | `up`, `down`, `half`, `commonAncestors`, `side`, `branchSex` |
| `partner`    | a partnership between the two                                           | `partnership` (marriage …), `ended`                          |
| `step`       | step-parent/-grandparent (`up`), stepchild (`down`), step-sibling (1/1) | `up`, `down`, `via` (the partner it goes through)            |
| `in-law`     | through one partnership: `partner-of-a`, `partner-of-b` or `both`       | `up`, `down` of the blood part, `partners`, `partnerSex`     |

`up` counts generations from `a` to the common ancestor and `down` from there to `b`: a parent is
1/0, a sibling 1/1, an aunt 2/1, a nephew 1/2, a first cousin 2/2, a second cousin once removed
3/4 (`cousinDegree` gives degree 2, removed 1). Every descriptor has the `path` from `a` to `b`
(for highlighting) and the sex of both people; `side` (paternal/maternal) and `branchSex` (the
sex of the aunt/uncle or sibling on `b`'s line) are what Polish and Russian terms need.

## How it is found

- **Blood:** the ancestors of both people are collected breadth-first (up to 15 generations,
  preferring biological links; each person once, so cycles in malformed data end). The _lowest_
  common ancestors are those none of whose children is a common ancestor; ancestors reached
  through the same children on both sides (a couple) form one relationship. Two separate lines –
  double cousins – give two descriptors. A relationship is **half** when only one of a couple is
  shared and the other parent on each line is known to differ (an unknown parent doesn't make it
  half). `lineage` records adoptive, foster or step links on the path.
- **In-laws:** blood relations of `a`'s partners to `b` (parent-in-law, sibling-in-law …), of `a`
  to `b`'s partners (child-in-law, sibling's partner …) and siblings among the partners of both
  (co-siblings-in-law).
- **Step:** a partner's descendant who isn't `a`'s own (stepchild), an ancestor's partner who
  isn't `a`'s ancestor (step-parent), and a child of a parent's partner who shares no parent with
  `a` (step-sibling).

A pair in a tree of 1 000 people takes well under 50 ms (tested).
