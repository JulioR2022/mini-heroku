"""
Definições dos limites de cada plano de conta.

Estrutura:
    - Cada plano é uma chave do dicionário PLAN_LIMITS
    - max_services: número máximo de serviços que o usuário pode ter (total, em todos os projetos)
    - max_projects: número máximo de projetos
    - mem_limit: limite de memória RAM para cada container Docker (formato Docker: "512m", "2g")
    - nano_cpus: limite de CPU em nanosegundos. 1 vCPU = 1_000_000_000 nano_cpus
      ex: 500_000_000 = 0.5 vCPU, 2_000_000_000 = 2 vCPU
"""

PLAN_LIMITS = {
    "free": {
        "max_services": 6,
        "max_projects": 3,
        "mem_limit": "512m",
        "nano_cpus": 500_000_000,
        "label": "Free",
    },
    "premium": {
        "max_services": 60,
        "max_projects": 15,
        "mem_limit": "2g",
        "nano_cpus": 2_000_000_000,
        "label": "Premium",
    },
}

def get_plan_limits(account_type: str) -> dict:
    """
    Retorna os limites do plano do usuário.
    """
    return PLAN_LIMITS.get(account_type, PLAN_LIMITS["free"])
