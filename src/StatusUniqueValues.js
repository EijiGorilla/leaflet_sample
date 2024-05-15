// lot status
export const lotStatusField = 'StatusNVS3';
export const statusLotLabel = [
  'Paid',
  'For Payment Processing',
  'For Legal Pass',
  'For Appraisal/Offer to Buy',
  'For Expro',
  'with WOP Fully Turned-over',
  'ROWUA/TUA',
];

export const statusLotColor = [
  '#70ad47', // Paid
  '#0070ff', // For Payment Processing
  '#ffff00', // For Legal Pass
  '#ffaa00', // For Appraisal/Offer to Buy
  '#ff0000', // For Expro
  '#00734c', // With WOP...
  '#55ff00', // ROWUA/TUA
];

export const statusLotQuery = statusLotLabel.map((status, index) => {
  return Object.assign({
    category: status,
    value: index + 1,
    color: statusLotColor[index],
  });
});
