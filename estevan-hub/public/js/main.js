/* ===== ESTEVAN HUB - JAVASCRIPT PRINCIPAL ===== */

class EstevanHub {
  constructor() {
    this.csrfToken = '';
    this.sessionId = this.getSessionId();
    this.usdRate = 5.25; // Taxa USD padrão, será atualizada
    this.selectedWhatsAppOption = null;
    this.whatsappNumber = '5518930855762'; // Número real do WhatsApp Business
    
    this.init();
  }

  async init() {
    // Inicializar componentes básicos
    this.initLucideIcons();
    this.createStarsBackground();
    this.setupScrollAnimations();
    this.setupCounterAnimations();
    
    // Componentes da UI
    this.setupContactForm();
    this.setupNavigation();
    this.setupWhatsApp();
    
    // Carregar dados
    await this.updateUSDRate();
    await this.loadNoticias();
    
    // Animações de entrada
    this.animateHeroEntrance();
  }

  // Métodos relacionados à UI
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

  // Métodos relacionados à animação
  setupScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  setupCounterAnimations() {
    const counters = document.querySelectorAll('.counter');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCounter(entry.target);
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

  // Métodos relacionados à integração com API
  async updateUSDRate() {
    try {
      const response = await fetch('/api/exchange-rate');
      if (response.ok) {
        const data = await response.json();
        this.usdRate = data.rate || 5.25;
      }
    } catch (error) {
      console.warn('Não foi possível obter cotação atualizada, usando taxa padrão');
      this.usdRate = 5.25;
    }
  }

  async loadNoticias() {
    try {
      const response = await fetch('/api/publications');
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
      return `
        <div class="bg-night-800/80 p-6 rounded-2xl border border-lunar-700/50 group hover:border-lunar-400/70 transition-all duration-300 shadow-lg flex flex-col h-full">
          <div class="flex items-center gap-3 mb-3">
            <div class="text-xs text-lunar-400">${noticia.data_formatada || ''}</div>
          </div>
          <h3 class="font-bold text-white mb-2 text-lg group-hover:text-lunar-400 transition-colors">
            <a href="/noticia/${noticia.slug}" class="hover:underline">${noticia.titulo}</a>
          </h3>
          <p class="text-lunar-200 text-sm mb-4 flex-1">${noticia.resumo ? noticia.resumo.substring(0, 120) + '...' : ''}</p>
          <a href="/noticia/${noticia.slug}" class="text-lunar-400 hover:underline font-semibold mt-auto flex items-center gap-1">
            <i data-lucide="arrow-right" class="w-4 h-4"></i> Ver mais
          </a>
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

  // Métodos relacionados ao WhatsApp
  setupWhatsApp() {
    const options = document.querySelectorAll('.whatsapp-option');
    const button = document.getElementById('whatsappButton');
    const buttonText = document.getElementById('buttonText');

    options.forEach(option => {
      option.addEventListener('click', () => {
        // Remover seleção anterior
        options.forEach(opt => opt.classList.remove('ring-2', 'ring-green-400'));
        
        // Adicionar seleção atual
        option.classList.add('ring-2', 'ring-green-400');
        
        // Guardar seleção
        this.selectedWhatsAppOption = option.getAttribute('data-option');
        
        // Habilitar botão
        button.disabled = false;
        buttonText.textContent = 'Enviar Mensagem no WhatsApp';
      });
    });

    if (button) {
      button.addEventListener('click', () => {
        if (this.selectedWhatsAppOption) {
          this.sendWhatsAppMessage();
        }
      });
    }
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
    
    // Feedback visual
    this.showNotification('Redirecionando para o WhatsApp...', 'success');
  }

  // Método para configurar o formulário de contato
  setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        message: formData.get('message'),
        source: 'website'
      };
      
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          this.showNotification('Mensagem enviada com sucesso!', 'success');
          form.reset();
        } else {
          throw new Error('Erro ao enviar mensagem');
        }
      } catch (error) {
        this.showNotification('Erro ao enviar mensagem. Tente novamente.', 'error');
      }
    });
  }

  setupNavigation() {
    // Setup smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // Métodos de utilidade
  getSessionId() {
    let sessionId = sessionStorage.getItem('id_sessao');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('id_sessao', sessionId);
    }
    return sessionId;
  }

  scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}" class="w-5 h-5"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);
    this.initLucideIcons();

    setTimeout(() => notification.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  animateHeroEntrance() {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      heroContent.style.opacity = '0';
      heroContent.style.transform = 'translateY(50px)';
      
      setTimeout(() => {
        heroContent.style.transition = 'opacity 1s ease, transform 1s ease';
        heroContent.style.opacity = '1';
        heroContent.style.transform = 'translateY(0)';
      }, 300);
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

// Add smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Add mobile menu toggle if needed
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        const nav = document.querySelector('nav');
        
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
    
    // Animation for service cards on scroll
    const serviceCards = document.querySelectorAll('.service-card');
    
    if (serviceCards.length > 0) {
        // Simple animation on scroll
        window.addEventListener('scroll', () => {
            serviceCards.forEach(card => {
                const rect = card.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }
            });
        });
        
        // Initial check
        setTimeout(() => {
            serviceCards.forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            });
            
            // Trigger initial animation check
            window.dispatchEvent(new Event('scroll'));
        }, 300);
    }
});