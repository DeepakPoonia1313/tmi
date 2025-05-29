import React, { useEffect, useRef } from 'react'
import Quill from 'quill'
// import 'quill/dist/quill.snow.css'

const RichTextEditorEdit = (props) => {
  const { record, property, onChange } = props
  console.log('RichTextEditorEdit props for configuration the image => ', props.property)
  const editorContainerRef = useRef(null)
  const toolbarRef = useRef(null)

  console.log(record, property, onChange, "These are the props in the RichTextEditorEdit .")

  useEffect(() => {
    // --- Create floating image toolbar
    const toolbar = document.createElement('div')
    toolbar.style.position = 'absolute'
    toolbar.style.zIndex = 1000
    toolbar.style.background = '#fff'
    toolbar.style.border = '1px solid #ccc'
    toolbar.style.padding = '5px 10px'
    toolbar.style.display = 'none'
    toolbar.style.gap = '10px'
    toolbar.style.borderRadius = '6px'
    toolbar.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)'
    toolbar.style.fontSize = '14px'
    toolbar.style.cursor = 'pointer'

    toolbar.innerHTML = `
      <span data-align="left">⬅️ Left</span>
      <span data-align="center">⬆️ Center</span>
      <span data-align="right">➡️ Right</span>
    `

    document.body.appendChild(toolbar)
    toolbarRef.current = toolbar

    toolbar.addEventListener('click', (e) => {
      const el = toolbar.currentImage
      const align = e.target.dataset.align
      if (!el || !align) return

      // 1. Apply the inline styles
      if (align === 'left') {
        el.style.float = 'left'
        el.style.marginRight = '50px'
        el.style.marginLeft = '0'
        el.style.display = ''
      } else if (align === 'right') {
        el.style.float = 'right'
        el.style.marginLeft = '50px'
        el.style.marginRight = '0'
        el.style.display = ''
      } else if (align === 'center') {
        el.style.float = ''
        el.style.marginLeft = 'auto'
        el.style.marginRight = 'auto'
        el.style.display = 'block'
      }

      // 2. Force Quill to recognize the change
      onChange(property.name, quill.root.innerHTML)

      // 3. Hide the toolbar
      toolbar.style.display = 'none'
    })

    // --- Quill init
    const quill = new Quill(editorContainerRef.current, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline'],
          ['blockquote', 'code-block'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean'],
        ],
        clipboard: { matchVisual: false }
      },
    })

    quill.on('text-change', () => {
      const imgs = quill.root.querySelectorAll('img')
      imgs.forEach(img => {
        img.style.maxWidth = '300px'
        img.style.height = 'auto'
      })

      onChange(property.name, quill.root.innerHTML)
    })

    // --- Image upload handler
    const toolbarModule = quill.getModule('toolbar')
    toolbarModule.addHandler('image', () => {
      const input = document.createElement('input')
      input.setAttribute('type', 'file')
      input.setAttribute('accept', 'image/*')
      input.click()

      input.onchange = async () => {
        const file = input.files[0]
        const formData = new FormData()
        // formData.append('file', file)
        formData.append('image', file)

        try {
          // const res = await fetch('/admin/upload/page-image', {
          //   method: 'POST',
          //   body: formData,
          // })

          const res = await fetch(`/upload/${property?.resourceId}/${property?.label}`, {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            throw new Error('Upload failed');
          }

          const data = await res.json()
          // const url = data.url
          const url = data.file;

          const range = quill.getSelection()
          const imgTag = `<img style="max-width: 300px" src="${url}">`
          quill.clipboard.dangerouslyPasteHTML(range.index, imgTag)

        } catch (err) {
          console.error('Image upload failed', err)
        }
      }
    })

    // --- Show image toolbar on click
    quill.root.addEventListener('click', (e) => {
      if (e.target.tagName === 'IMG') {
        const rect = e.target.getBoundingClientRect()
        toolbar.style.left = `${rect.left + window.scrollX + rect.width / 2 - 60}px`
        toolbar.style.top = `${rect.top + window.scrollY - 40}px`
        toolbar.style.display = 'flex'
        toolbar.currentImage = e.target
      } else {
        toolbar.style.display = 'none'
      }
    })

    // --- Handle content update
    quill.on('text-change', () => {
      onChange(property.name, quill.root.innerHTML)
    })

    const initialValue = record.params[property.name] || ''
    quill.root.innerHTML = initialValue
  }, [])

  return (
    <div>
      <label>{property.label}</label>
      <div ref={editorContainerRef} style={{ height: 300 }} />
    </div>
  )
}

export default RichTextEditorEdit
