/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  export default function autoTable(
    doc: jsPDF,
    options: any
  ): void;
}
