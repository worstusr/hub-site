/* ===== SIMULADOR DE CAMPANHAS ===== */

class CampaignSimulator {
  constructor() {
    this.usdRate = 5.25; // Taxa padrão USD
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateCalculations();
    this.loadUSDRate();
  }

  setupEventListeners() {
    const investmentSlider = document.getElementById('investmentSlider');
    const goalSelect = document.getElementById('goalSelect');
    const durationSelect = document.getElementById('durationSelect');

    if (investmentSlider) {
      investmentSlider.addEventListener('input', () => {
        document.getElementById('investmentValue').textContent = investmentSlider.value;
        this.updateCalculations();
      });
    }

    if (goalSelect) {
      goalSelect.addEventListener('change', () => {
        this.updateCalculations();
      });
    }

    if (durationSelect) {
      durationSelect.addEventListener('change', () => {
        this.updateCalculations();
      });
    }
  }

  async loadUSDRate() {
    try {
      const response = await fetch('/api/exchange-rate');
      if (response.ok) {
        const data = await response.json();
        this.usdRate = data.rate || 5.25;
        this.updateCalculations();
      }
    } catch (error) {
      console.warn('Não foi possível obter cotação atualizada');
    }
  }

  updateCalculations() {
    const investment = parseFloat(document.getElementById('investmentSlider')?.value || 100);
    const goal = document.getElementById('goalSelect')?.value || 'engagement';
    const duration = parseInt(document.getElementById('durationSelect')?.value || 3);

    // Converter para USD para cálculos baseados na API do Meta
    const investmentUSD = investment / this.usdRate;
    const dailyBudgetUSD = investmentUSD / duration;

    // Calcular métricas baseadas em dados reais do Meta Ads
    const metrics = this.calculateMetrics(investmentUSD, dailyBudgetUSD, goal, duration);

    // Atualizar interface
    this.updateInterface(metrics, investment, duration);
  }

  calculateMetrics(investmentUSD, dailyBudgetUSD, goal, duration) {
    // Fatores baseados em dados reais do Meta Ads (2024)
    const baseCPM = goal === 'engagement' ? 8.5 : goal === 'traffic' ? 12.3 : 18.7; // USD
    const baseReach = (investmentUSD * 1000) / baseCPM;
    
    // Ajustar por duração (campanhas mais longas têm frequência maior)
    const frequencyFactor = Math.min(1 + (duration / 30), 2.5);
    const impressions = baseReach * frequencyFactor;

    // Taxas de engajamento por objetivo
    const engagementRates = {
      engagement: { ctr: 0.035, like: 0.025, comment: 0.008, share: 0.003 },
      traffic: { ctr: 0.028, like: 0.015, comment: 0.004, share: 0.002 },
      conversions: { ctr: 0.022, like: 0.012, comment: 0.003, share: 0.001 }
    };

    const rates = engagementRates[goal];
    
    return {
      reach: {
        min: Math.round(baseReach * 0.8),
        max: Math.round(baseReach * 1.2)
      },
      impressions: {
        min: Math.round(impressions * 0.85),
        max: Math.round(impressions * 1.15)
      },
      interactions: {
        clicks: {
          min: Math.round(impressions * rates.ctr * 0.8),
          max: Math.round(impressions * rates.ctr * 1.2)
        },
        likes: {
          min: Math.round(impressions * rates.like * 0.7),
          max: Math.round(impressions * rates.like * 1.3)
        },
        comments: {
          min: Math.round(impressions * rates.comment * 0.6),
          max: Math.round(impressions * rates.comment * 1.4)
        },
        shares: {
          min: Math.round(impressions * rates.share * 0.5),
          max: Math.round(impressions * rates.share * 1.5)
        }
      }
    };
  }

  updateInterface(metrics, investment, duration) {
    // Atualizar alcance e impressões
    const reachElement = document.getElementById('reachCount');
    const impressionsElement = document.getElementById('impressionsCount');
    
    if (reachElement) {
      reachElement.textContent = `${metrics.reach.min.toLocaleString()} - ${metrics.reach.max.toLocaleString()}`;
    }
    
    if (impressionsElement) {
      impressionsElement.textContent = `${metrics.impressions.min.toLocaleString()} - ${metrics.impressions.max.toLocaleString()}`;
    }

    // Atualizar interações
    this.updateElement('clicksCount', metrics.interactions.clicks);
    this.updateElement('likesCount', metrics.interactions.likes);
    this.updateElement('loveCount', { min: Math.round(metrics.interactions.likes.min * 0.4), max: Math.round(metrics.interactions.likes.max * 0.4) });
    this.updateElement('commentsCount', metrics.interactions.comments);
    this.updateElement('sharesCount', metrics.interactions.shares);
    this.updateElement('actionsCount', { min: Math.round(metrics.interactions.clicks.min * 0.3), max: Math.round(metrics.interactions.clicks.max * 0.3) });

    // Atualizar informações da campanha
    const durationInfo = document.getElementById('durationInfo');
    const dailyCost = document.getElementById('dailyCost');
    
    if (durationInfo) {
      durationInfo.textContent = duration === 1 ? '1 dia' : `${duration} dias`;
    }
    
    if (dailyCost) {
      dailyCost.textContent = (investment / duration).toFixed(2);
    }
  }

  updateElement(elementId, range) {
    const element = document.getElementById(elementId);
    if (element && range) {
      element.textContent = `${range.min}-${range.max}`;
    }
  }

  // Método para integrar com WhatsApp
  generateWhatsAppMessage() {
    const investment = document.getElementById('investmentSlider')?.value || 100;
    const goal = document.getElementById('goalSelect')?.value || 'engagement';
    const duration = document.getElementById('durationSelect')?.value || 3;

    const goalNames = {
      engagement: 'Engajamento (curtidas, comentários)',
      traffic: 'Tráfego para site/negócio',
      conversions: 'Conversões e vendas'
    };

    return `🎯 *Simulação de Campanha - Estevan Hub*

💰 *Investimento:* R$ ${investment}
🎯 *Objetivo:* ${goalNames[goal]}
📅 *Duração:* ${duration} ${duration === 1 ? 'dia' : 'dias'}
💵 *Por dia:* R$ ${(investment / duration).toFixed(2)}

Vim através do simulador e gostaria de uma *proposta personalizada* para essa campanha.

*Quando podemos conversar sobre os detalhes?* 📞`;
  }
}

// Inicializar simulador quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('investmentSlider')) {
    window.campaignSimulator = new CampaignSimulator();
  }
});

// Função global para integração com outros scripts
window.getSimulatorMessage = () => {
  return window.campaignSimulator ? window.campaignSimulator.generateWhatsAppMessage() : '';
};
