---
theme: gaia
_class: lead
paginate: true
backgroundColor: #fff
marp: true
backgroundImage: url('images/presentation/background.svg')
---

![bg right:40% 80%](images/icon.png)

# **Graffiti**

Create custom callgraphs, directly from your Editor

---

# Why graphs?

![bg right:40% 80%](images/presentation/example_callgraph.png)

- Graphs help to understand complex flows.
- They can serve as great documentation tool.
- Graphs contains less distractions then a (possibly obfuscated) code.

---

# Why Not graphs?

![bg right:40% 80%](images/presentation/example_bad_callgraph.png)

- Creating a good, informative graph requires time and effort.
- on the contrary, automatically generated call-graphs are usually bloated, containing a lot of unimportant calls.
- There is no standard, so it's hard to share them with colleagues.

---

# Graffiti

What if you could create a graph directly from your editor?

- You don't have to layout the nodes.
- Clicking on the node would open them in the edior.
- Renamed the method? It will be updated on the graph.
- Can be exported to mermaid.

---

# Architecture

- **Frontend** - Shows the graph.
- **Server** - Multiplex between the frontend and editors.

<style>
img[alt~="center"] {
  display: block;
  margin: 0 auto;
}
</style>

![width:700px center](images/architecture.png)

---

# Supported editors

| Editor   | Languages                            | Rename support |
| -------- | ------------------------------------ | -------------- |
| JEB      | Java                                 | ✅             |
| Intellij | Java, Kotlin                         | ❌             |
| VSCode   | Depends on available language server | ❌             |
| OpenGrok | \*                                   | ❌             |
| IDA      | \*                                   | ✅             |

---

![bg](images/screenshots/screenshot.png)

---

# **Demo**
