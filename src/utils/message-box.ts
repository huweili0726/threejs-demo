import { ElMessageBox } from 'element-plus'
import type { MessageBoxData } from 'element-plus'

export const messageBoxUtils = {
  showCustomPopup: (title: string, content: any[], onDelete?: (id: string) => void): Promise<MessageBoxData> => {
    let messageContent = `
      <div class="scifi-popup-table">
        <div class="scifi-popup-table-header">
          <div class="scifi-popup-table-column scifi-popup-table-column-name">名称</div>
          <div class="scifi-popup-table-column scifi-popup-table-column-thumbnail">缩略图</div>
          <div class="scifi-popup-table-column scifi-popup-table-column-action">操作</div>
        </div>
        ${content.map(item => `
          <div class="scifi-popup-table-row" data-id="${item.id}">
            <div class="scifi-popup-table-column scifi-popup-table-column-name">
              <span class="scifi-popup-label">${item.name}:</span>
              <span class="scifi-popup-value">${item.value}</span>
            </div>
            <div class="scifi-popup-table-column scifi-popup-table-column-thumbnail">
              ${item.thumbnail ? `<img src="${item.thumbnail}" class="scifi-popup-thumbnail" alt="缩略图" />` : '<span class="scifi-popup-thumbnail-placeholder">无缩略图</span>'}
            </div>
            <div class="scifi-popup-table-column scifi-popup-table-column-action">
              <button class="scifi-popup-delete-btn" data-id="${item.id}">删除</button>
            </div>
          </div>
        `).join('')}
      </div>
    `

    const promise = ElMessageBox.alert(messageContent, title, {
      type: '',
      customClass: 'scifi-popup',
      dangerouslyUseHTMLString: true,
      center: true,
      showConfirmButton: false,
      showClose: true
    })

    // 添加删除按钮事件监听
    if (onDelete) {
      setTimeout(() => {
        const deleteButtons = document.querySelectorAll('.scifi-popup-delete-btn')
        deleteButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            e.stopPropagation()
            const id = (e.target as HTMLElement).dataset.id
            if (id) {
              onDelete(id)
            }
          })
        })
      }, 100)
    }

    return promise
  }
}
