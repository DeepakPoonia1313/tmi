
import React, { useState } from "react";
import { Label, Box, DropZone } from "@adminjs/design-system";

const AvatarEdit = (props) => {
  const { property, onChange, record } = props;
  const currentValue = record.params[property.name];
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files) => {
    if (files && files.length > 0) {
      const file = files[0];

      const formData = new FormData();
      formData.append('file', file);

      try {
        setUploading(true);

        const response = await fetch('/admin/upload', { // <-- note the path
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        const fileUrl = data.url; // should be something like "/uploads/userImages/abc.jpg"

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
          mimeTypes: ["image/png", "image/jpeg", "image/gif"],
          maxSize: 1048576, // 1MB
        }}
        disabled={uploading}
      />

      <Box marginTop="sm">
        <small>Upload JPG, PNG, or GIF, max 1MB</small>
      </Box>
    </Box>
  );
};

export default AvatarEdit;
