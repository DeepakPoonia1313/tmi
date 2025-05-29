import React, { useState } from 'react'
import { Label, Box, DropZone } from '@adminjs/design-system'

const ImageUploadComponent = (props) => {
  //   const { property, onChange, record } = props
  //   const currentValue = record.params?.[property.name]
  //   const [uploading, setUploading] = useState(false)

  //   const handleUpload = async (files) => {
  //     const file = files?.[0]
  //     if (!file) return

  //     const formData = new FormData()
  //     formData.append('image', file)

  //     try {
  //       setUploading(true)
  //       console.log(record, " These are the records object");
  //       console.log(property, " These are the property object");
  //       const res = await fetch(`/upload/${property?.resourceId}/${property?.label}`, {
  //         method: 'POST',
  //         body: formData,
  //       })

  //       if (!res.ok) throw new Error('Upload failed')

  //       const data = await res.json()
  //       const fileUrl = data.file; // e.g., /uploads/userImages/abc.jpg
  //       console.log(fileUrl, "This it the file url .")
  //       onChange(property.name, fileUrl)
  //     } catch (e) {
  //       console.error('Upload error:', e)
  //       alert('Failed to upload image')
  //     } finally {
  //       setUploading(false)
  //     }
  //   }

  //   return (
  //     <Box marginBottom="xl">
  //       <Label>{property.label || 'Image'}</Label>

  //       {currentValue && (
  //         <Box marginBottom="default">
  //           <img
  //             src={currentValue}
  //             alt="Preview"
  //             style={{
  //               width: '100px',
  //               height: '100px',
  //               objectFit: 'cover',
  //               borderRadius: '8px',
  //               marginBottom: '10px',
  //             }}
  //           />
  //         </Box>
  //       )}

  //       <DropZone
  //         onChange={handleUpload}
  //         multiple={false}
  //         validate={{
  //           mimeTypes: ['image/png', 'image/jpeg', 'image/gif'],
  //           maxSize: 1024 * 1024 * 25, // 1MB
  //         }}
  //         disabled={uploading}
  //       />

  //       <Box marginTop="sm">
  //         <small>Only JPG, PNG, GIF. Max 1MB.</small>
  //       </Box>
  //     </Box>
  //   )
  // }

  const { property, onChange, record } = props;
  const currentValue = record.params[property.name];
  const [uploading, setUploading] = useState(false);

  console.log(" These are the values in the image upload component => ", property, onChange, record)
  const handleUpload = async (files) => {
    if (files && files.length > 0) {
      const file = files[0];

      const formData = new FormData();
      formData.append('image', file);

      try {
        setUploading(true);

        const response = await fetch(`/upload/${property?.resourceId}/${property?.label}`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        const fileUrl = data.file; // should be something like "/uploads/userImages/abc.jpg"

        // Save the file URL to the record
        onChange(property.name, fileUrl);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <Box marginBottom="xl">
      <Label>{property.label || "Avatar"}</Label>

      {currentValue && (
        <Box marginBottom="default">
          <img
            src={currentValue}
            alt="Avatar preview"
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: "10px",
            }}
          />
        </Box>
      )}

      <DropZone
        onChange={handleUpload}
        multiple={false}
        validate={{
          maxSize: 104857600, // 1MB
        }}
        disabled={uploading}
      />

      <Box marginTop="sm">
        <small>Upload JPG, PNG, or GIF, max 1MB</small>
      </Box>
    </Box>
  );
};


export default ImageUploadComponent
