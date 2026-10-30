---
description: Record adoptive, step and foster parents, marriages and partnerships with dates, divorces, remarriages and half-siblings.
---

# Relationships

Families are more than father, mother and children. Family Insight records **how** people are
related, and draws remarriages, half-siblings and adoptions clearly.

## Parents: biological, adoptive, step or foster

Every parent link has a type. Open the **⋯** menu next to a parent (in the child's panel) or next to
a child (in the parent's panel) and choose:

- **Biological** – the default. A person can have at most two biological parents.
- **Adoptive**, **Step** or **Foster** – as many as needed.

<Screenshot name="parent-kind" alt="The options menu next to the parent Jan Kowalski with the types Biological, Adoptive, Step and Foster and Remove relationship" />

Non-biological parent links are drawn with a **dashed line** in the tree, and the type is shown
next to the name in the family lists (for example “Adoptive”).

::: tip Two biological parents are already there?
**+ Parent** then adds the new parent as a **step-parent**. If they are really the biological
parent, first change one of the existing parents to adoptive, step or foster.
:::

## Partners and marriages {#partners}

A person can have any number of partners. To add the details of a relationship, open the **⋯** menu
next to the partner and choose **Edit partnership**:

<Screenshot name="partnership-dialog" alt="The Edit partnership dialog with type, start date, place, end date and how it ended" />

- **Type** – Married, Partners, Engaged or Together.
- **Start date** and **Place** – for example the wedding date and the church or town. Dates work
  like everywhere else: `1978`, `06.1978` or `~1978` ([more about dates](./editing#dates)).
- **End date** and **How it ended** – Divorce, Separation, Death of a partner or Other. Leave
  **Not ended** for relationships that continue.

The family list then shows, for example, “Married 12 June 1978, until 3 March 1990”. Ended
partnerships are drawn with a dashed line in the tree.

## Remarriages and half-siblings

When a person has had several partners, Family Insight places the person in the middle with the
partners on either side, ordered by the start of the relationship, and draws each couple's
children under the right pair:

<Screenshot name="remarriage" alt="Piotr Kowalski between his two wives, Magdalena Nowicka and Katarzyna Kowalska, with the son from the first marriage under the first couple and two children from the second under the second couple" />

Siblings who share only one parent are marked **half-sibling** in the family list. When you add
a child to someone with several partners, Family Insight asks who the other parent is
([Adding people](./people)).

## Removing a relationship

Open the **⋯** menu next to the relative and choose **Remove relationship**:

<Screenshot name="relation-options" alt="The options menu next to the partner Magdalena Nowicka with Edit partnership and Remove relationship" />

Only the connection
is removed – both people stay in the tree. A message with **Undo** appears for a few seconds; you
can also undo later with <kbd>Ctrl</kbd>+<kbd>Z</kbd>.

## Impossible relationships

Family Insight stops connections that cannot be right and tells you why, for example:

- _A person can't be related to themselves._
- _These people are already related this way._
- _That would make someone their own ancestor._
- _A person can have at most two biological parents. Mark one as adoptive, step or foster instead._

Nothing changes in the tree when this happens.
