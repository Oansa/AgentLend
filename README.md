# AgentLend

**Algorithmic A2A Credit for the CROO Network** - A decentralized lending protocol for autonomous agents.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

AgentLend solves the **A2A Liquidity Gap** - the critical bottleneck where orchestrator agents cannot fund sub-agent operations due to lack of upfront capital. It provides algorithmic, on-chain credit scores (ACS) to enable automated micro-loans for the agent economy.

### How It Works

```
1. Agent requests loan → ACS score calculated (300-900 scale)
2. Score determines collateral ratio (10-40%)
3. USDC disbursed to agent's wallet
4. Sub-agents hired via CAP orders
5. Loan automatically repaid when primary order completes
```

## Architecture

```
ml-oracle/          # ACS Scoring Service (TypeScript)
├── src/
│   ├── services/
│   │   ├── scoringEngine.ts    # ML score calculation
│   │   ├── blockchainService.ts # Contract interaction
│   │   ├── capService.ts       # CROO CAP integration
│   │   └── queueService.ts     # Background job processing
│   └── index.ts              # Fastify API server

contracts/            # Solidity Smart Contracts
├── contracts/
│   ├── LendingPool.sol       # Core lending protocol
│   ├── ACSOracle.sol         # On-chain score storage
│   └── CollateralManager.sol # Collateral handling

dashboard/            # React Monitoring Dashboard
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx     # Protocol overview
│   │   ├── Loans.tsx         # Loan management
│   │   └── Agents.tsx        # Agent credit scores
│   └── lib/
│       ├── contractHooks.ts  # React hooks for contracts
│       └── apiClient.ts      # API client
```

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm or npm
- Redis (for job queue)
- Base RPC endpoint

### 1. Clone & Install
```bash
git clone https://github.com/agentlend/agentlend.git
cd agentlend
pnpm install
```

### 2. Configure Environment
```bash
cp ml-oracle/.env.example ml-oracle/.env
# Edit .env with your values:
# - RPC_URL (Base Sepolia: https://sepolia.base.org)
# - PRIVATE_KEY (for oracle signing)
# - CONTRACT addresses after deployment
```

### 3. Run Tests
```bash
# ML Oracle tests
pnpm test --filter @agentlend/ml-oracle

# Dashboard tests  
pnpm test --filter @agentlend/dashboard
```

### 4. Start Services
```bash
# Start ML Oracle (port 3001)
pnpm dev --filter @agentlend/ml-oracle

# Start Dashboard (port 3000)
pnpm dev --filter @agentlend/dashboard
```

### 5. Deploy Contracts
```bash
cd contracts
pnpm hardhat compile
pnpm hardhat run scripts/deploy.ts --network baseSepolia
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/score` | POST | Calculate ACS score |
| `/score/enqueue` | POST | Queue async score calculation |
| `/score/:agentDID` | GET | Get stored score |
| `/demo/scores` | GET | Demo scores |
| `/demo/orders` | GET | Demo CAP orders |
| `/webhook/cap-order` | POST | CAP order webhook |

## ACS Scoring Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Transaction Activity | 15% | On-chain tx frequency |
| Total Volume | 20% | USD transaction volume |
| Counterparty Diversity | 10% | Unique counterparties |
| Account Age | 10% | Days active |
| Token Diversity | 5% | Tokens used |
| DeFi Engagement | 10% | Protocol interactions |
| Lending History | 15% | Repayment rate |
| Reputation | 10% | Off-chain reputation |
| KYC Verification | 5% | Identity verified |
| Social Proof | 10% | GitHub/Twitter presence |

## Collateral Ratios

| Score Range | Collateral |
|-----------|-----------|
| 900+ | 10% |
| 700-899 | 15% |
| 500-699 | 25% |
| 300-499 | 40% |

## Hackathon Submission

**Track**: DeFi / On-chain Ops Agents (+ A2A Agents)

- ✅ Listed on CROO Agent Store (DID: `did:croo:agentlend`)
- ✅ Integrated with CAP for loan disbursement/repayment
- ✅ Open source (MIT License)
- ⏳ Demo video (Day 10)
- ✅ Tests, documentation

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Links

- [CROO Network](https://croo.network)
- [DoraHacks BUIDL](https://dorahacks.io)
- [Hackathon Details](https://dorahacks.io/hackathon/croo-hackathon/detail)