const calculateSettlementBreakdown = ({
  grossAmount = 0,
  deductions = 0,
  taxRate = 0,
  commissionRate = 0,
  freightRate = 0,
  quantity = 0,
  unitPrice = 0,
}) => {
  const effectiveGrossAmount = Number(grossAmount || quantity * unitPrice || 0);
  const deductionValue = Number(deductions || 0);
  const taxValue = effectiveGrossAmount * (Number(taxRate || 0) / 100);
  const commissionValue =
    effectiveGrossAmount * (Number(commissionRate || 0) / 100);
  const freightValue = effectiveGrossAmount * (Number(freightRate || 0) / 100);
  const totalDeductions =
    deductionValue + taxValue + commissionValue + freightValue;
  const netAmount = Math.max(0, effectiveGrossAmount - totalDeductions);

  return {
    grossAmount: Number(effectiveGrossAmount.toFixed(2)),
    deductions: Number(totalDeductions.toFixed(2)),
    taxValue: Number(taxValue.toFixed(2)),
    commissionValue: Number(commissionValue.toFixed(2)),
    freightValue: Number(freightValue.toFixed(2)),
    netAmount: Number(netAmount.toFixed(2)),
  };
};

module.exports = {
  calculateSettlementBreakdown,
};
