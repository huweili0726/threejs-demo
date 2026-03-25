import { ElMessageBox } from 'element-plus'
import type { MessageBoxData } from 'element-plus'

export interface PopupContentItem {
  name: string
  value: string
}

export const messageBoxUtils = {
  showCustomPopup: (title: string, content: PopupContentItem[]): Promise<MessageBoxData> => {
    let messageContent = `
      <div class="scifi-popup-content">
        ${content.map(item => `
          <div class="scifi-popup-row">
            <span class="scifi-popup-label">${item.name}:</span>
            <span class="scifi-popup-value">${item.value}</span>
          </div>
        `).join('')}
      </div>
    `

    return ElMessageBox.alert(messageContent, title, {
      confirmButtonText: '确认',
      type: 'info',
      customClass: 'scifi-popup',
      dangerouslyUseHTMLString: true,
      center: true
    })
  }
}
