import React from 'react'
import sanitize from 'sanitize-html'

const RichTextEditorList = (props) => {
  const { record, property } = props
  const rawValue = record.params[property.name] || ''

  // 1. Sanitize the HTML
  const safeHtml = sanitize(rawValue, {
    allowedTags: sanitize.defaults.allowedTags.concat(['img']),
    allowedAttributes: {
      ...sanitize.defaults.allowedAttributes,
      img: ['src', 'style'],
    },
  })

  // 2. Strip HTML tags to get plain text
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = safeHtml
  const plainText = tempDiv.textContent || tempDiv.innerText || ''

  // 3. Trim plain text for preview
  const previewText = plainText.length > 100
    ? plainText.substring(0, 100) + '...'
    : plainText

  return (
    <div>
        {previewText}
    </div>
  )
}

export default RichTextEditorList
