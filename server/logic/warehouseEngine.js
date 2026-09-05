const SHIPPING_COST_PER_SHIPMENT = 450;

export function computeFulfillment(quotationLines, warehouses, products) {
  const oneTimeLines = quotationLines.filter((line) => {
    const product = products.find((p) => p.id === line.productId);
    return product.type === "one_time" && product.category === "Hardware";
  });

  const allocations = [];
  const backorders = [];

  for (const line of oneTimeLines) {
    const product = products.find((p) => p.id === line.productId);
    let remaining = line.qty;
    const perWarehouse = [];

    for (const wh of warehouses) {
      if (remaining <= 0) break;
      const available = wh.stock[product.id] || 0;
      if (available <= 0) continue;
      const take = Math.min(available, remaining);
      perWarehouse.push({ warehouseId: wh.id, warehouseName: wh.name, qty: take });
      remaining -= take;
    }

    if (perWarehouse.length > 0) {
      allocations.push({ productId: product.id, productName: product.name, allocations: perWarehouse });
    }

    if (remaining > 0) {
      backorders.push({ productId: product.id, productName: product.name, backorderQty: remaining });
    }
  }

  const warehousesUsed = new Set();
  allocations.forEach((a) => a.allocations.forEach((x) => warehousesUsed.add(x.warehouseId)));
  const shipmentCount = warehousesUsed.size || (backorders.length > 0 ? 0 : 1);
  const estimatedShippingCost = shipmentCount * SHIPPING_COST_PER_SHIPMENT;

  return {
    allocations,
    backorders,
    shipmentCount,
    estimatedShippingCost,
    hasBackorder: backorders.length > 0
  };
}
