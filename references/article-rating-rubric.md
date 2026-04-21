# Article Rating Rubric v1

Use this rubric before writing a new raw archive. The goal is not to judge whether an article is "good" in the abstract, but whether it creates compounding value for the knowledge base.

## Why rate articles

Not all archived articles are equally useful. In practice they usually fall into a few buckets:

- `news` — tells you what happened, but adds little durable understanding
- `explanation` — may not be factually new, but explains an idea unusually well
- `analysis` — adds structure, trade-offs, or clear new judgment
- `reference` — useful as an index, map, or documentation entry point
- `synthesis` — combines multiple threads into a higher-level view
- `insight-trigger` — directly sparks a reusable judgment worth preserving

Ratings help you:
- quickly surface the most valuable articles later
- separate "new facts" from "great explanation"
- drive downstream decisions for wiki cards, summaries, and insights

## Required rating block

Add this block near the top of every raw archive, after source metadata and before the main content:

```md
## 文章评级

- 类型：analysis
- 干货指数：5/5
- 知识增量：4/5
- 表达价值：4/5
- 行动价值：5/5
- 总评：5/5
- 一句话判断：这是高密度工程实践文，真正新增的不是概念，而是把治理对象拆到了 ownership / authority / contract / handoff / eval 这一层。
```

## Four dimensions

### 1. Dry-goods density (`干货指数`)
Measures useful information density, not article length.

- `1/5` — mostly fluff, reposting, hype, or vibes
- `2/5` — some useful points, but a lot can be skipped
- `3/5` — clearly useful, worth storing
- `4/5` — dense enough to revisit later
- `5/5` — unusually dense; almost every section adds value

### 2. Knowledge delta (`知识增量`)
Measures whether the article adds new facts, structures, or judgments relative to the existing knowledge base.

- `1/5` — almost no new value; mostly repeats what is already known
- `2/5` — some extra detail, but still mostly overlap
- `3/5` — clear supplement or clearer framing
- `4/5` — materially strengthens current understanding; often worth updating wiki/summary
- `5/5` — structural newness that changes how the topic is understood

### 3. Expression value (`表达价值`)
Measures whether the article is worth reusing as a future explanation template.

- `1/5` — muddled or awkward; not useful to borrow from
- `2/5` — readable, but weak framing
- `3/5` — clear enough to reference later
- `4/5` — strong explanation, easy to reuse in conversation or writing
- `5/5` — exceptional explanatory frame, worth citing repeatedly

### 4. Action value (`行动价值`)
Measures how directly the article helps current product thinking, architecture work, training, or decisions.

- `1/5` — know-it-and-move-on value only
- `2/5` — indirectly relevant
- `3/5` — somewhat useful for decisions
- `4/5` — directly helpful for product, architecture, or strategic judgment
- `5/5` — can directly inform plans, frameworks, or knowledge-base restructuring

## Overall score (`总评`)
Keep this simple. Do not over-engineer weighting.

Default rule of thumb:
- if two dimensions are `>= 4`, the overall score is usually at least `4/5`
- if there is a clear structural leap or strong insight trigger, `5/5` is justified
- pure news rarely deserves more than `3/5`

## Routing rules

Use the rating to drive the next step:

- `知识增量 >= 4` → strongly check whether `wiki/` should be updated
- `表达价值 >= 4` → strongly check whether `comparisons/` or `summaries/` should be updated
- `行动价值 >= 4` → strongly check whether a new `insights/` entry should be written

## What not to do

- Do not put ratings into the title.
- Do not rely only on tags; tags are too coarse.
- Do not use a 10-point scale; it creates fake precision.

## One-line principle

**A rating exists to answer one question: does this article create compounding value for the knowledge base?**
