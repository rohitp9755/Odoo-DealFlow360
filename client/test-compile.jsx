import React from 'react';
import { renderToString } from 'react-dom/server';
import PriceListManager from './src/components/PriceListManager';

try {
  console.log(renderToString(<PriceListManager />));
} catch (err) {
  console.error("COMPILE ERROR:", err);
}
