# 🚀 Enterprise AI API Gateway (Proof of Concept)

![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

## 📌 The Problem: "The Integration Zoo"
As engineering organizations scale their AI initiatives, microservices often integrate directly with various LLM providers. This leads to:
* **AI Margin Collapse:** No centralized control over API token usage and spending.
* **Downtime Vulnerability:** If OpenAI goes down, internal services crash.
* **Security Risks:** Hardcoded API keys scattered across multiple repositories.

## 💡 The Solution
This POC establishes a **Centralized AI API Gateway**. By decoupling AI routing from individual microservices, we establish a secure and observable layer for all LLM traffic.

### Key Features
* **🛡️ Smart Fallback Routing:** Automatically switches to a backup model (e.g., Claude 3) if the primary model fails.
* **💸 FinOps & Chargeback Ready:** Logs token consumption per internal `team_id`.
* **🔒 Centralized Authentication:** Internal services use local tokens; external LLM keys remain isolated.

---

## 🛠️ Quick Start (Docker)

1. Update `docker-compose.yml` with your API keys.
2. Run the Gateway:
```bash
docker-compose up --build
