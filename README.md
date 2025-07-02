# Mini-RAG Chatbot  
_A compact Retrieval-Augmented Generation assistant built with Azure AI Search & GPT-4o-mini_

---

## ✨ Why This Project?

- **One-day build.** From scratch to production-ready in a single workday.  
- **Own your knowledge.** Index up to **30 MB** of PDFs, DOCXs, or Markdown and query them instantly.  
- **Source-cited answers.** Every response includes a page-level link so you can verify the facts.  
- **Tiny footprint.** Runs comfortably under **$10 month** (OpenAI S0 + AI Search Free Tier).  
- **Resume-worthy.** Demonstrates practical RAG, Azure OpenAI, Search, and cloud IaC skills.

---

## 🗺 High-Level Roadmap

| Phase | Outcome | Key Azure Services |
|-------|---------|--------------------|
| **0 – Prep** | Local repo, `docs/` library, toolchain (VS Code + CLI) | — |
| **1 – Core Infra** | Resource Group, GPT-4o-mini (S0), AI Search (Free), Blob Storage | Resource Manager, AI Studio |
| **2 – RAG Pipeline** | ‘Chat with your data’ wizard → 100 % indexed | AI Studio |
| **3 – Security & UI (Optional)** | Key Vault secrets, Static Web App (React WebChat) | Key Vault, Static Web Apps |
| **4 – Automation** | GitHub Actions CI/CD, cost alerts, App Insights | GitHub Actions, Cost Mgmt, Insights |

> Skip Phases 3-4 for a lean demo—you’ll still have a working chatbot by the end of Phase 2.

---

## � Architecture Snapshot
Blob Storage (docs) ──► Azure AI Search (embeddings + vector)
User HTTPS ─► Chat Endpoint (GPT-4o-mini S0 / RAG)


- **Smart Chunking** splits large docs into < 3k tokens.  
- **Reranker v3** boosts relevance without extra cost on Free tier.  
- All traffic stays in the **West Europe** region → GDPR friendly.

---

## ▶️ Instant Demo Flow

1. **Upload** your AZ-104 guide, AI-102 notes, or internal PDFs to `docs/`.
2. Wizard completes → **Indexed 100 %**.
3. Ask:  
   > _"What is Managed Identity?"_  
   Chatbot returns:  
   > `Managed identity …`<br>`🔗 Source: AZ104-Guide.pdf p.34`

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| LLM Model | **Azure OpenAI GPT-4o-mini (S0)** |
| Vector Store | **Azure AI Search Free Tier** |
| Storage | **Azure Blob Storage (Hot)** |
| Orchestration | **AI Studio ‘Chat with your data’** |
| DevOps | **GitHub Actions**, Azure CLI |
| (Optional) UI | **React + Azure Static Web Apps** |
| Security | **Azure Key Vault**, Cost Alerts |

---

## 🚑 Common Pitfalls & Fixes

| Issue | Fix |
|-------|-----|
| **“No relevant documents”** | Re-index or add more documents. |
| **> 3k token chunk error** | Re-index → Advanced → set chunk size = 2000. |
| **429 Rate Limit** | Respect `Retry-After`; lower `temperature` to 0.3. |
| **Ghost citations after edits** | Delete blob → Re-index to purge old embeddings. |

---

## 🌱 Future Enhancements

- **Agents SDK** for multi-step actions (e.g., create a VM from chat).  
- **Teams / Slack connector** via Bot Framework Web Chat.  
- **Upgrade path** to GPT-4.1 or private Search partitions when scaling beyond 1 GB.

---

## 📄 License

MIT — use, remix, and impress your interviewers.  
Contributions are welcome—open an issue or PR!