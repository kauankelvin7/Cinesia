# Backend Java legado

Este diretório preserva a primeira arquitetura backend do Cinesia, baseada em Spring Boot.

## Status

**Histórico / fora do runtime atual.**

A aplicação publicada não depende deste backend. O produto ativo usa Firebase Auth, Firestore, Realtime Database e Storage diretamente a partir do frontend.

## Por que ele continua aqui?

O código registra decisões e modelagem anteriores e pode ser útil para estudo, comparação ou uma futura migração deliberada. Ele não deve, porém, ser tratado como segundo backend ativo.

## Regras

- não adicionar features novas aqui sem uma decisão arquitetural explícita;
- não criar chamadas do frontend para `localhost:8080`;
- não manter arquivos de log, build, `.old` ou credenciais;
- qualquer reativação exige ADR nova, threat model e plano de migração;
- mudanças no produto atual devem acontecer no frontend/Firebase até decisão em contrário.

## Stack histórica

- Java 17+
- Spring Boot 3
- Spring Security
- JPA/Hibernate
- H2 em desenvolvimento
- API REST

O histórico permanece no Git; arquivos duplicados e artefatos locais podem ser removidos da árvore ativa sem perda de rastreabilidade.
