import { ElMessageBox } from 'element-plus'
import type { MessageBoxData } from 'element-plus'

export interface PopupContentItem {
  name: string
  value: string
}

export const messageBoxUtils = {
  showCustomPopup: (title: string, content: PopupContentItem[]): Promise<MessageBoxData> => {
    let messageContent = ''
    content.forEach((item) => {
      messageContent += `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(0, 160, 198, 0.1); font-size: 14px;">
        <span style="font-weight: 500; color: #00a0c6; flex-shrink: 0; margin-right: 12px;">${item.name}:</span>
        <span style="color: #333333; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;">${item.value}</span>
      </div>`
    })

    return ElMessageBox.alert(messageContent, title, {
      confirmButtonText: '确定',
      type: 'info',
      customClass: 'custom-popup',
      dangerouslyUseHTMLString: true,
      center: true
    })
  }
}
