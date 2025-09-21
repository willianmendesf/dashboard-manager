import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Configurações</h1>
        <p>Gerencie as configurações do sistema e sua conta</p>
      </div>

      <div class="settings-grid">
        <div class="settings-section">
          <h2>Perfil</h2>
          <div class="setting-group">
            <div class="setting-item">
              <label>Nome Completo</label>
              <input type="text" value="João Silva" />
            </div>
            <div class="setting-item">
              <label>Email</label>
              <input type="email" value="joao.silva@email.com" />
            </div>
            <div class="setting-item">
              <label>Telefone</label>
              <input type="tel" value="+55 11 99999-9999" />
            </div>
            <div class="setting-item">
              <label>Cargo</label>
              <select>
                <option>Administrador</option>
                <option>Gerente</option>
                <option>Analista</option>
              </select>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2>Notificações</h2>
          <div class="setting-group">
            <div class="setting-toggle">
              <label>
                <input type="checkbox" checked />
                <span class="toggle-slider"></span>
                Notificações por email
              </label>
            </div>
            <div class="setting-toggle">
              <label>
                <input type="checkbox" checked />
                <span class="toggle-slider"></span>
                Notificações push
              </label>
            </div>
            <div class="setting-toggle">
              <label>
                <input type="checkbox" />
                <span class="toggle-slider"></span>
                Relatórios semanais
              </label>
            </div>
            <div class="setting-toggle">
              <label>
                <input type="checkbox" checked />
                <span class="toggle-slider"></span>
                Alertas de segurança
              </label>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2>Aparência</h2>
          <div class="setting-group">
            <div class="setting-item">
              <label>Tema</label>
              <select>
                <option>Claro</option>
                <option>Escuro</option>
                <option>Automático</option>
              </select>
            </div>
            <div class="setting-item">
              <label>Idioma</label>
              <select>
                <option>Português (BR)</option>
                <option>English</option>
                <option>Español</option>
              </select>
            </div>
            <div class="setting-item">
              <label>Formato de Data</label>
              <select>
                <option>DD/MM/AAAA</option>
                <option>MM/DD/AAAA</option>
                <option>AAAA-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2>Segurança</h2>
          <div class="setting-group">
            <div class="setting-item">
              <label>Alterar Senha</label>
              <button class="btn-secondary">Alterar</button>
            </div>
            <div class="setting-toggle">
              <label>
                <input type="checkbox" checked />
                <span class="toggle-slider"></span>
                Autenticação de dois fatores
              </label>
            </div>
            <div class="setting-item">
              <label>Sessões Ativas</label>
              <div class="sessions-list">
                <div class="session-item">
                  <div class="session-info">
                    <span class="session-device">💻 Chrome - Windows</span>
                    <span class="session-time">Ativo agora</span>
                  </div>
                  <button class="btn-danger-small">Encerrar</button>
                </div>
                <div class="session-item">
                  <div class="session-info">
                    <span class="session-device">📱 Safari - iPhone</span>
                    <span class="session-time">2h atrás</span>
                  </div>
                  <button class="btn-danger-small">Encerrar</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2>Sistema</h2>
          <div class="setting-group">
            <div class="setting-item">
              <label>Backup Automático</label>
              <select>
                <option>Diário</option>
                <option>Semanal</option>
                <option>Mensal</option>
                <option>Desabilitado</option>
              </select>
            </div>
            <div class="setting-item">
              <label>Retenção de Logs</label>
              <select>
                <option>30 dias</option>
                <option>90 dias</option>
                <option>1 ano</option>
              </select>
            </div>
            <div class="setting-toggle">
              <label>
                <input type="checkbox" checked />
                <span class="toggle-slider"></span>
                Coleta de dados de uso
              </label>
            </div>
          </div>
        </div>

        <div class="settings-section danger-zone">
          <h2>Zona de Perigo</h2>
          <div class="setting-group">
            <div class="setting-item">
              <label>Exportar Dados</label>
              <button class="btn-secondary">Exportar</button>
            </div>
            <div class="setting-item">
              <label>Excluir Conta</label>
              <button class="btn-danger">Excluir Permanentemente</button>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-footer">
        <button class="btn-primary">Salvar Alterações</button>
        <button class="btn-secondary">Cancelar</button>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      color: #1F2937;
      font-size: 32px;
      font-weight: bold;
    }

    .page-header p {
      margin: 0;
      color: #6B7280;
      font-size: 16px;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .settings-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .settings-section.danger-zone {
      border: 1px solid #FEE2E2;
      background: #FFFBFB;
    }

    .settings-section h2 {
      margin: 0 0 20px 0;
      color: #1F2937;
      font-size: 20px;
      font-weight: bold;
      padding-bottom: 12px;
      border-bottom: 1px solid #E5E7EB;
    }

    .danger-zone h2 {
      color: #DC2626;
    }

    .setting-group {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .setting-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .setting-item label {
      color: #374151;
      font-size: 14px;
      font-weight: 500;
    }

    .setting-item input,
    .setting-item select {
      padding: 12px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.3s ease;
    }

    .setting-item input:focus,
    .setting-item select:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .setting-toggle {
      display: flex;
      align-items: center;
    }

    .setting-toggle label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 14px;
      color: #374151;
    }

    .setting-toggle input[type="checkbox"] {
      display: none;
    }

    .toggle-slider {
      width: 44px;
      height: 24px;
      background: #D1D5DB;
      border-radius: 12px;
      margin-right: 12px;
      position: relative;
      transition: background 0.3s ease;
    }

    .toggle-slider::before {
      content: '';
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: transform 0.3s ease;
    }

    .setting-toggle input:checked + .toggle-slider {
      background: #3B82F6;
    }

    .setting-toggle input:checked + .toggle-slider::before {
      transform: translateX(20px);
    }

    .sessions-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
    }

    .session-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #F9FAFB;
      border-radius: 8px;
    }

    .session-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .session-device {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .session-time {
      font-size: 12px;
      color: #6B7280;
    }

    .btn-primary,
    .btn-secondary,
    .btn-danger,
    .btn-danger-small {
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #3B82F6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563EB;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: #F3F4F6;
      color: #374151;
      border: 1px solid #D1D5DB;
    }

    .btn-secondary:hover {
      background: #E5E7EB;
    }

    .btn-danger {
      background: #DC2626;
      color: white;
    }

    .btn-danger:hover {
      background: #B91C1C;
      transform: translateY(-1px);
    }

    .btn-danger-small {
      background: #FEE2E2;
      color: #DC2626;
      padding: 6px 12px;
      font-size: 12px;
    }

    .btn-danger-small:hover {
      background: #FCA5A5;
    }

    .settings-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    @media (max-width: 768px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }
      
      .settings-footer {
        flex-direction: column;
      }
    }
  `]
})
export class SettingsComponent {
}