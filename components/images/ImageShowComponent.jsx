import React from 'react'
import { Box } from '@adminjs/design-system'

const ImageShowComponent = (props) => {
  const { record, property } = props
  const imageUrl = record.params?.[property.name]
  console.log('image url', imageUrl);
  
  if (!imageUrl) return <span>No image</span>

  return (
    <Box>
      <img
        src={imageUrl}
        alt="Uploaded"
        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
      />
    </Box>
  )
}

export default ImageShowComponent
