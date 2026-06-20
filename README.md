# 3D Print Cost Calculator 🖨️💰

Calculadora de costos reales para impresiones 3D. Desplegada en Vercel.

## Cómo usar

1. Ingresa los datos de tu impresión
2. Los valores por defecto están configurados para Chile (La Florida, Enel)
3. El resultado se calcula instantáneamente
4. Guarda tus cálculos en el historial

## Valores por defecto

- Electricidad: $200/kWh (Enel La Florida, tarifa BT1 post-descongelamiento)
- Impresora: $340.000 con vida útil de 3.000h
- Filamento: $12.000/kg (PLA estándar)

## Stack

- HTML + CSS + JS vanilla (SPA)
- Chart.js para gráficos
- localStorage para persistencia
- Vercel para hosting

## Desarrollo

```bash
# Servir localmente
python3 -m http.server 8000
# o
npx serve .
```
