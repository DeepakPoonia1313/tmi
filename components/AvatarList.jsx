import React from 'react';
import { Box, Text } from '@adminjs/design-system';

const AvatarList = (props) => {
  const { record } = props;
  const srcValue = record.params.avatar;
  const name = record.params.name || 'Unknown';
  const email = record.params.email || '';

  return (
    <Box flex alignItems="center">
      {srcValue ? (
        <img
          src={srcValue}
          alt={`${name}'s avatar`}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            objectFit: 'cover',
            marginRight: '10px',
          }}
        />
      ) : (
        <Box
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#757575',
            fontSize: '16px',
            fontWeight: 'bold',
            marginRight: '10px',
          }}
        >
          {name.charAt(0).toUpperCase()}
        </Box>
      )}
      <Box flex flexDirection="column">
        <Text fontWeight="bold">{name}</Text>
        <Text fontSize="sm" color="grey60">{email}</Text>
      </Box>
    </Box>
  );
};

export default AvatarList;