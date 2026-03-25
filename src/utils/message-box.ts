import { ElMessageBox } from 'element-plus'
import type { MessageBoxData } from 'element-plus'

export const messageBoxUtils = {
  showCustomPopup: (title: string, content: any[], onDelete?: (id: string) => void, onAdd?: () => void): Promise<MessageBoxData | void> => {
    let messageContent = `
      <div class="scifi-popup-actions">
        <button class="scifi-popup-add-btn">新增</button>
      </div>
      <div class="scifi-popup-table">
        <div class="scifi-popup-table-header">
          <div class="scifi-popup-table-column scifi-popup-table-column-name">名称</div>
          <div class="scifi-popup-table-column scifi-popup-table-column-thumbnail">缩略图</div>
          <div class="scifi-popup-table-column scifi-popup-table-column-action">操作</div>
        </div>
        <div class="scifi-popup-table-body">
          ${content.map(item => `
            <div class="scifi-popup-table-row" data-id="${item.id}">
              <div class="scifi-popup-table-column scifi-popup-table-column-name">
                <span class="scifi-popup-label">${item.name}</span>
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
      </div>
    `

    const promise = ElMessageBox.alert(messageContent, title, {
      type: '',
      customClass: 'scifi-popup',
      dangerouslyUseHTMLString: true,
      center: true,
      showConfirmButton: false,
      showClose: true
    }).catch(() => {
      // 捕获关闭按钮的取消事件
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

    // 添加新增按钮事件监听
    if (onAdd) {
      setTimeout(() => {
        const addButton = document.querySelector('.scifi-popup-add-btn')
        if (addButton) {
          addButton.addEventListener('click', (e) => {
            e.stopPropagation()
            onAdd()
          })
        }
      }, 100)
    }

    return promise
  }
}
