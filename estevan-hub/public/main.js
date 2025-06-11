/* ===== ESTEVAN HUB - JAVASCRIPT PRINCIPAL ===== */

class EstevanHub {
    constructor() {
      this.csrfToken = '';
      this.sessionId = '';
      this.securityInitialized = false;
      this.usdRate = 5.25; // Taxa USD padrão, será atualizada
      this.selectedWhatsAppOption = null;
      this.whatsappNumber = '5511999999999'; // Número do WhatsApp Business da Estevan Hub
      
      this.init();
    }
  
    async init() {
      // Inicializar componentes básicos
      this.initLucideIcons();
      this.createStarsBackground();
      this.setupScrollAnimations();
      this.setupCounterAnimations();
      
      // Tentar inicializar segurança sem mostrar erro imediatamente
      await this.initializeSecurity();
      
      // Setup dos componentes
      this.setupContactForm();
      this.setupSimulator();
      this.setupNavigation();
      this.trackVisit();
      
      // Setup do WhatsApp
      this.setupWhatsApp();
      
      // Atualizar cotação do dólar
      await this.updateUSDRate();
      
      // Carregar notícias
      await this.loadNoticias();
      
      // Animações de entrada
      this.animateHeroEntrance();
    }
  
    initLucideIcons() {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  
    createStarsBackground() {
      const starsContainer = document.getElementById('stars');
      if (!starsContainer) return;
      
      const numberOfStars = 150;
      
      for (let i = 0; i < numberOfStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.cssText = `
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          opacity: ${Math.random() * 0.8 + 0.2};
          animation-delay: ${Math.random() * 3}s;
          animation-duration: ${Math.random() * 3 + 2}s;
        `;
        starsContainer.appendChild(star);
      }
    }
  
    setupScrollAnimations() {
      const animatedElements = document.querySelectorAll('.animate-on-scroll');
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });
  
      animatedElements.forEach(el => observer.observe(el));
    }
  
    setupCounterAnimations() {
      const counters = document.querySelectorAll('.counter');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      });
  
      counters.forEach(counter => observer.observe(counter));
    }
  
    animateCounter(element) {
      const target = parseInt(element.getAttribute('data-target'));
      const duration = target > 50 ? 2000 : 1500; // Animação mais rápida para números menores
      const step = target / (duration / 16);
      let current = 0;
  
      const updateCounter = () => {
        current += step;
        if (current < target) {
          element.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          element.textContent = target;
        }
      };
  
      updateCounter();
    }
  
    async initializeSecurity() {
      try {
        // Verificar se estamos em desenvolvimento local ou se o backend existe
        const response = await fetch('/backend/api/csrf');
        
        if (!response.ok) {
          // Em caso de erro, simular tokens para desenvolvimento
          this.csrfToken = 'dev_token_' + Date.now();
          this.securityInitialized = true;
          
          const captchaEl = document.getElementById('captchaQuestion');
          if (captchaEl) {
            const a = Math.floor(Math.random() * 10) + 1;
            const b = Math.floor(Math.random() * 10) + 1;
            captchaEl.textContent = `${a} + ${b} = ?`;
            captchaEl.setAttribute('data-answer', a + b);
          }
          return;
        }
        
        const data = await response.json();
        
        if (data.csrf_token) {
          this.csrfToken = data.csrf_token;
          const captchaEl = document.getElementById('captchaQuestion');
          if (captchaEl) {
            captchaEl.textContent = data.captcha_question;
          }
          this.securityInitialized = true;
        }
      } catch (error) {
        // Modo desenvolvimento - não mostrar erro
        console.warn('Backend não disponível, rodando em modo desenvolvimento');
        this.csrfToken = 'dev_token_' + Date.now();
        this.securityInitialized = true;
        
        const captchaEl = document.getElementById('captchaQuestion');
        if (captchaEl) {
          const a = Math.floor(Math.random() * 10) + 1;
          const b = Math.floor(Math.random() * 10) + 1;
          captchaEl.textContent = `${a} + ${b} = ?`;
          captchaEl.setAttribute('data-answer', a + b);
        }
      }
    }
  
    async updateUSDRate() {
      try {
        // Tentar API gratuita de cotação
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();
          this.usdRate = data.rates.BRL || 5.25;
        }
      } catch (error) {
        // Usar taxa padrão em caso de erro
        console.warn('Não foi possível obter cotação atualizada, usando taxa padrão');
        this.usdRate = 5.25;
      }
    }
  
    setupContactForm() {
      const form = document.getElementById('contactForm');
      if (!form) return;
  
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleContactSubmit(form);
      });
    }
  
    async handleContactSubmit(form) {
      if (!this.securityInitialized) {
        this.showNotification('Sistema de segurança não inicializado. Recarregue a página.', 'error');
        return;
      }
  
      const formData = new FormData(form);
      const button = form.querySelector('button[type="submit"]');
      const originalText = button.innerHTML;
  
      // Validações
      const validation = this.validateContactForm(formData);
      if (!validation.valid) {
        this.showNotification(validation.message, 'error');
        return;
      }
  
      // Loading state
      button.innerHTML = '<div class="loading-spinner inline-block mr-3"></div>Enviando...';
      button.disabled = true;
  
      try {
        const response = await fetch('/backend/api/contato', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.csrfToken
          },
          body: JSON.stringify({
            nome: formData.get('name').trim(),
            email: formData.get('email').trim(),
            mensagem: formData.get('message').trim(),
            captcha: parseInt(formData.get('captcha')),
            csrf_token: this.csrfToken
          })
        });
  
        const data = await response.json();
  
        if (data.sucesso) {
          button.innerHTML = '<i data-lucide="check" class="w-5 h-5 inline mr-3"></i>Mensagem Enviada!';
          button.className = button.className.replace('from-lunar-500 to-lunar-600', 'from-green-500 to-green-600');
          form.reset();
          this.showNotification('Mensagem enviada com sucesso!', 'success');
          await this.initializeSecurity(); // Refresh tokens
        } else {
          throw new Error(data.erro || 'Erro ao enviar mensagem');
        }
      } catch (error) {
        button.innerHTML = '<i data-lucide="x" class="w-5 h-5 inline mr-3"></i>Erro ao Enviar';
        button.className = button.className.replace('from-lunar-500 to-lunar-600', 'from-red-500 to-red-600');
        this.showNotification('Erro ao enviar mensagem: ' + error.message, 'error');
      } finally {
        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
          button.className = button.className.replace(/from-(green|red)-500 to-(green|red)-600/g, 'from-lunar-500 to-lunar-600');
          this.initLucideIcons();
        }, 3000);
      }
    }
  
    validateContactForm(formData) {
      const name = formData.get('name').trim();
      const email = formData.get('email').trim();
      const message = formData.get('message').trim();
      const captcha = formData.get('captcha');
  
      if (name.length < 2 || name.length > 100) {
        return { valid: false, message: 'Nome deve ter entre 2 e 100 caracteres' };
      }
  
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { valid: false, message: 'Email inválido' };
      }
  
      if (message.length < 10 || message.length > 1000) {
        return { valid: false, message: 'Mensagem deve ter entre 10 e 1000 caracteres' };
      }
  
      if (!captcha || isNaN(captcha)) {
        return { valid: false, message: 'Resolva a conta matemática' };
      }
  
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /<script/i, /javascript:/i, /vbscript:/i, /onload=/i, /onerror=/i
      ];
  
      if (suspiciousPatterns.some(pattern => pattern.test(name + email + message))) {
        return { valid: false, message: 'Conteúdo suspeito detectado' };
      }
  
      return { valid: true };
    }
  
    setupSimulator() {
      const investmentSlider = document.getElementById("investmentSlider");
      const goalSelect = document.getElementById("goalSelect");
      const durationSelect = document.getElementById("durationSelect");
  
      if (!investmentSlider) return;
  
      // Definir valor inicial como 3 dias
      if (durationSelect) {
        durationSelect.value = "3";
      }
  
      const updateSimulation = () => {
        this.updateSimulationResults();
      };
  
      investmentSlider.addEventListener("input", updateSimulation);
      goalSelect?.addEventListener("change", updateSimulation);
      durationSelect?.addEventListener("change", updateSimulation);
  
      // Initial update
      updateSimulation();
    }
  
    updateSimulationResults() {
      const totalInvestment = Math.max(10, parseInt(document.getElementById("investmentSlider")?.value) || 100);
      const goal = document.getElementById("goalSelect")?.value || 'engagement';
      const duration = parseInt(document.getElementById("durationSelect")?.value) || 3;
  
      // NOVA LÓGICA AVANÇADA DO SIMULADOR BASEADA NO FACEBOOK ADS
      
      // 1. CÁLCULO DA MARGEM DA ESTEVAN HUB (20% estratégia + gestão)
      const estevanHubFee = totalInvestment * 0.20;
      const actualAdsInvestment = totalInvestment - estevanHubFee;
      
      // 2. PARÂMETROS BASEADOS NO META ADS (atualizados 2024)
      const metaParams = {
        // CPM em USD convertido para BRL
        cpmUSD: {
          engagement: { min: 0.80, max: 2.50 },
          traffic: { min: 1.20, max: 3.80 },
          conversions: { min: 2.50, max: 8.00 }
        },
        
        // CTR médio por objetivo
        ctr: {
          engagement: { min: 2.8, max: 5.2 },
          traffic: { min: 1.5, max: 3.1 },
          conversions: { min: 0.9, max: 2.3 }
        },
        
        // Taxa de engajamento por objetivo
        engagementRate: {
          engagement: { min: 4.2, max: 7.8 },
          traffic: { min: 1.8, max: 3.4 },
          conversions: { min: 1.2, max: 2.6 }
        }
      };
  
      // 3. CONVERSÃO DE CPM USD PARA BRL
      const cpmBRL = {
        min: metaParams.cpmUSD[goal].min * this.usdRate,
        max: metaParams.cpmUSD[goal].max * this.usdRate
      };
  
      // 4. FATOR DE DURAÇÃO (campanhas mais longas têm CPM menor)
      const durationMultiplier = duration >= 7 ? 0.85 : duration >= 14 ? 0.75 : 1.0;
      const adjustedCPM = {
        min: cpmBRL.min * durationMultiplier,
        max: cpmBRL.max * durationMultiplier
      };
  
      // 5. CÁLCULO DE IMPRESSÕES BASEADO NO INVESTIMENTO REAL EM ADS
      const impressionsMin = Math.floor((actualAdsInvestment / adjustedCPM.max) * 1000);
      const impressionsMax = Math.floor((actualAdsInvestment / adjustedCPM.min) * 1000);
  
      // 6. CÁLCULO DE ALCANCE (frequência média 1.3-2.1)
      const avgFrequency = goal === 'engagement' ? 1.8 : goal === 'traffic' ? 1.5 : 1.3;
      const reachMin = Math.floor(impressionsMin / (avgFrequency + 0.3));
      const reachMax = Math.floor(impressionsMax / (avgFrequency - 0.2));
  
      // 7. CÁLCULO DE INTERAÇÕES BASEADO EM BENCHMARKS REAIS
      const avgImpressions = (impressionsMin + impressionsMax) / 2;
      const engagementParams = metaParams.engagementRate[goal];
      
      const interactions = {
        // Distribuição típica de reações no Facebook
        likes: {
          min: Math.floor(avgImpressions * (engagementParams.min * 0.65) / 100),
          max: Math.floor(avgImpressions * (engagementParams.max * 0.65) / 100)
        },
        love: {
          min: Math.floor(avgImpressions * (engagementParams.min * 0.15) / 100),
          max: Math.floor(avgImpressions * (engagementParams.max * 0.15) / 100)
        },
        comments: {
          min: Math.floor(avgImpressions * (engagementParams.min * 0.12) / 100),
          max: Math.floor(avgImpressions * (engagementParams.max * 0.12) / 100)
        },
        shares: {
          min: Math.floor(avgImpressions * (engagementParams.min * 0.08) / 100),
          max: Math.floor(avgImpressions * (engagementParams.max * 0.08) / 100)
        }
      };
  
      // 8. CÁLCULO DE CLIQUES E AÇÕES
      const ctrParams = metaParams.ctr[goal];
      const clicks = {
        min: Math.floor(avgImpressions * (ctrParams.min / 100)),
        max: Math.floor(avgImpressions * (ctrParams.max / 100))
      };
  
      // Taxa de conversão de cliques para ações
      const conversionRate = goal === 'conversions' ? 0.25 : goal === 'traffic' ? 0.15 : 0.08;
      const actions = {
        min: Math.floor(clicks.min * conversionRate),
        max: Math.floor(clicks.max * conversionRate)
      };
  
      // 9. ATUALIZAR INTERFACE COM VALORES CALCULADOS
      this.updateSimulatorUI({
        investment: totalInvestment,
        actualAdsInvestment: actualAdsInvestment,
        estevanHubFee: estevanHubFee,
        duration,
        reachMin,
        reachMax,
        impressionsMin,
        impressionsMax,
        interactions,
        clicks,
        actions,
        goal,
        cpmRange: adjustedCPM,
        usdRate: this.usdRate
      });
  
      // Track simulation
      this.trackSimulation({
        investment_amount: totalInvestment,
        ads_investment: actualAdsInvestment,
        estevan_fee: estevanHubFee,
        goal,
        duration_days: duration,
        estimated_reach_min: reachMin,
        estimated_reach_max: reachMax,
        estimated_impressions_min: impressionsMin,
        estimated_impressions_max: impressionsMax,
        usd_rate: this.usdRate
      });
    }
  
    updateSimulatorUI(data) {
      // Atualizar valores principais
      const elements = {
        investmentValue: data.investment.toLocaleString("pt-BR"),
        reachCount: `${data.reachMin.toLocaleString("pt-BR")} - ${data.reachMax.toLocaleString("pt-BR")}`,
        impressionsCount: `${data.impressionsMin.toLocaleString("pt-BR")} - ${data.impressionsMax.toLocaleString("pt-BR")}`,
        durationInfo: data.duration === 1 ? "1 dia" : `${data.duration} dias`,
        dailyCost: (data.investment / data.duration).toLocaleString("pt-BR", {minimumFractionDigits: 2, maximumFractionDigits: 2})
      };
  
      Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      });
  
      // Atualizar interações com novos valores calculados
      const interactionElements = {
        likesCount: `${data.interactions.likes.min}-${data.interactions.likes.max}`,
        loveCount: `${data.interactions.love.min}-${data.interactions.love.max}`,
        commentsCount: `${data.interactions.comments.min}-${data.interactions.comments.max}`,
        sharesCount: `${data.interactions.shares.min}-${data.interactions.shares.max}`,
        clicksCount: `${data.clicks.min}-${data.clicks.max}`,
        actionsCount: `${data.actions.min}-${data.actions.max}`
      };
  
      Object.entries(interactionElements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      });
  
      // Adicionar tooltip com informações técnicas (opcional)
      this.addSimulatorTooltips(data);
    }
  
    addSimulatorTooltips(data) {
      // Adicionar informações técnicas como tooltips para transparência
      const reachEl = document.getElementById('reachCount');
      if (reachEl && !reachEl.hasAttribute('title')) {
        reachEl.setAttribute('title', 
          `CPM: R$ ${data.cpmRange.min.toFixed(2)} - R$ ${data.cpmRange.max.toFixed(2)}\n` +
          `Investimento em ads: R$ ${data.actualAdsInvestment.toFixed(2)}\n` +
          `Taxa gestão Estevan Hub: R$ ${data.estevanHubFee.toFixed(2)}\n` +
          `Cotação USD: R$ ${data.usdRate.toFixed(2)}`
        );
      }
    }
  
    async loadNoticias() {
      try {
        const response = await fetch('/backend/api/publications.php');
        if (!response.ok) throw new Error('Erro ao carregar notícias');
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          this.renderNoticias(data);
        } else {
          this.renderNoticiasError();
        }
      } catch (error) {
        console.warn('Erro ao carregar notícias:', error);
        this.renderNoticiasError();
      }
    }
  
    renderNoticias(noticias) {
      const container = document.getElementById('noticiasContainer');
      if (!container) return;
  
      if (noticias.length === 0) {
        container.innerHTML = `
          <div class="col-span-3 text-center py-8">
            <p class="text-lunar-400">Nenhuma notícia disponível no momento.</p>
          </div>
        `;
        return;
      }
  
      const noticiasHTML = noticias.slice(0, 3).map(noticia => {
        const corClasses = {
          'emerald': 'from-emerald-400 to-emerald-600',
          'purple': 'from-purple-400 to-purple-600', 
          'orange': 'from-orange-400 to-orange-600',
          'cyan': 'from-cyan-400 to-cyan-600',
          'pink': 'from-pink-400 to-pink-600',
          'blue': 'from-blue-400 to-blue-600'
        };
  
        const gradientClass = corClasses[noticia.cor_categoria] || corClasses.blue;
  
        return `
          <div class="bg-night-800/60 p-6 rounded-2xl border border-lunar-700/50 group hover:border-${noticia.cor_categoria}-500/50 transition-all duration-300 news-card">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 bg-gradient-to-r ${gradientClass} rounded-xl flex items-center justify-center">
                <i data-lucide="${noticia.icone_categoria || 'newspaper'}" class="w-6 h-6 text-white"></i>
              </div>
              <div>
                <div class="font-bold text-${noticia.cor_categoria}-400 text-sm uppercase">${noticia.fonte || ''}</div>
                <div class="text-xs text-lunar-400">${noticia.data_formatada || ''}</div>
              </div>
            </div>
            <h5 class="font-bold text-white mb-3 leading-tight group-hover:text-${noticia.cor_categoria}-400 transition-colors">
              <a href="noticia.html?slug=${noticia.slug}">${noticia.titulo}</a>
            </h5>
            <p class="text-lunar-200 text-sm leading-relaxed mb-4">
              ${noticia.resumo}
            </p>
            <div class="flex items-center justify-between text-xs">
              <span class="text-lunar-400">Categoria: ${noticia.categoria || noticia.categoria_nome || ''}</span>
              <a href="noticia.html?slug=${noticia.slug}" class="flex items-center gap-1 text-${noticia.cor_categoria}-400 hover:text-${noticia.cor_categoria}-300 transition-colors">
                <i data-lucide="arrow-right" class="w-3 h-3"></i>
                <span>Ler mais</span>
              </a>
            </div>
          </div>
        `;
      }).join('');
  
      container.innerHTML = noticiasHTML;
      this.initLucideIcons(); // Reinicializar ícones
    }
  
    renderNoticiasError() {
      const container = document.getElementById('noticiasContainer');
      if (!container) return;
  
      container.innerHTML = `
        <div class="col-span-3 text-center py-8">
          <i data-lucide="wifi-off" class="w-12 h-12 text-lunar-600 mx-auto mb-4"></i>
          <p class="text-lunar-400">Não foi possível carregar as notícias.</p>
          <button onclick="window.estevanHub.loadNoticias()" class="mt-2 text-lunar-500 hover:text-lunar-400 text-sm">
            Tentar novamente
          </button>
        </div>
      `;
      this.initLucideIcons();
    }
  
    setupNavigation() {
      // Smooth scroll
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          e.preventDefault();
          const target = document.querySelector(anchor.getAttribute('href'));
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    }
  
    animateHeroEntrance() {
      setTimeout(() => {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
          heroContent.classList.add('fade-in-up');
        }
      }, 300);
    }
  
    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}" class="w-5 h-5"></i>
          <span>${message}</span>
        </div>
      `;
  
      document.body.appendChild(notification);
      this.initLucideIcons();
  
      setTimeout(() => notification.classList.add('show'), 100);
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 4000);
    }
  
    setupWhatsApp() {
      const options = document.querySelectorAll('.whatsapp-option');
      const button = document.getElementById('whatsappButton');
      const buttonText = document.getElementById('buttonText');
  
      options.forEach(option => {
        option.addEventListener('click', () => {
          // Remove seleção anterior
          options.forEach(opt => {
            opt.classList.remove('selected', 'ring-2', 'ring-green-400', 'bg-green-500/20');
          });
  
          // Adiciona seleção atual
          option.classList.add('selected', 'ring-2', 'ring-green-400', 'bg-green-500/20');
          
          this.selectedWhatsAppOption = option.dataset.option;
          
          // Atualiza botão
          button.disabled = false;
          button.classList.remove('disabled:opacity-50', 'disabled:cursor-not-allowed');
          
          const optionTexts = {
            'existing': 'Falar sobre preços e planos 💼',
            'create-managed': 'Pacote completo com gestão 🚀', 
            'create-only': 'Setup de perfis profissionais ⚙️'
          };
          
          buttonText.textContent = optionTexts[this.selectedWhatsAppOption];
          
          // Animação de confirmação
          option.style.transform = 'scale(1.02)';
          setTimeout(() => {
            option.style.transform = 'scale(1)';
          }, 200);
        });
      });
  
      button.addEventListener('click', () => {
        if (this.selectedWhatsAppOption) {
          this.sendWhatsAppMessage();
        }
      });
    }
  
    sendWhatsAppMessage() {
      const messages = {
        'existing': `🎯 *Olá, Estevan Hub!*
  
  Vim através do site e *já tenho redes sociais ativas*.
  
  Gostaria de saber mais sobre:
  • Preços e planos de gestão
  • Como potencializar meus resultados
  • Estratégias personalizadas para meu negócio
  
  *Quando podemos conversar?* 📞`,
  
        'create-managed': `🚀 *Olá, Estevan Hub!*
  
  Vim através do site e *quero começar do zero com estratégia profissional*.
  
  Preciso de:
  • Criação completa de redes sociais
  • Gestão profissional das contas
  • Estratégias de marketing aplicadas
  • Acompanhamento dos resultados
  
  *Qual o investimento para o pacote completo?* 💼`,
  
        'create-only': `⚙️ *Olá, Estevan Hub!*
  
  Vim através do site e *quero apenas criar redes sociais profissionais*.
  
  Preciso de:
  • Setup completo de perfis (Instagram, Facebook, etc.)
  • Configurações otimizadas
  • Templates e orientações básicas
  • Entrega para eu mesmo administrar
  
  *Quanto custa esse serviço?* 📱`
      };
  
      const message = messages[this.selectedWhatsAppOption];
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${this.whatsappNumber}?text=${encodedMessage}`;
      
      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank');
      
      // Tracking do evento
      this.trackWhatsAppClick();
      
      // Feedback visual
      this.showNotification('Redirecionando para o WhatsApp...', 'success');
    }
  
    trackWhatsAppClick() {
      const sessionId = this.getSessionId();
      
      if (this.csrfToken.startsWith('dev_token_')) {
        console.log('WhatsApp click trackado (modo dev):', {
          option: this.selectedWhatsAppOption,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      fetch('/backend/api/rastrear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'whatsapp_click',
          id_sessao: sessionId,
          opcao_selecionada: this.selectedWhatsAppOption,
          timestamp: new Date().toISOString()
        })
      }).catch(console.error);
    }
  
    // Tracking functions
    trackVisit() {
      const sessionId = this.getSessionId();
      
      // Só tentar fazer tracking se o backend estiver disponível
      if (this.csrfToken.startsWith('dev_token_')) {
        console.log('Modo desenvolvimento - tracking simulado');
        return;
      }
      
      fetch('/backend/api/rastrear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'visita',
          url: window.location.href,
          origem: document.referrer,
          id_sessao: sessionId
        })
      }).catch(console.error);
    }
  
    trackSimulation(data) {
      const sessionId = this.getSessionId();
      
      // Só tentar fazer tracking se o backend estiver disponível
      if (this.csrfToken.startsWith('dev_token_')) {
        console.log('Simulação trackada (modo dev):', data);
        return;
      }
      
      fetch('/backend/api/rastrear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'simulacao',
          id_sessao: sessionId,
          ...data
        })
      }).catch(console.error);
    }
  
    getSessionId() {
      let sessionId = sessionStorage.getItem('id_sessao');
      if (!sessionId) {
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('id_sessao', sessionId);
      }
      return sessionId;
    }
  
    // Global scroll function
    scrollToSection(sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    window.estevanHub = new EstevanHub();
    
    // Make scrollToSection global for onclick handlers
    window.scrollToSection = (sectionId) => {
      window.estevanHub.scrollToSection(sectionId);
    };
  });
  