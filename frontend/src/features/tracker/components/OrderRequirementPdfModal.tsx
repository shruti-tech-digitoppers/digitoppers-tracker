'use client';

import React, { useState, useRef } from 'react';
import { Stage3ExtractedData } from '../utils/stage3RequirementExtractor';
import {
  X,
  Printer,
  FileText,
  Cpu,
  Layers,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardList
} from 'lucide-react';

export type PdfDepartmentTab = 'ALL' | 'HARDWARE' | 'TECH' | 'CONTENT';

interface OrderRequirementPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Stage3ExtractedData;
  initialTab?: PdfDepartmentTab;
  allowDepartmentSwitch?: boolean;
}

export const OrderRequirementPdfModal: React.FC<OrderRequirementPdfModalProps> = ({
  isOpen,
  onClose,
  data,
  initialTab = 'ALL',
  allowDepartmentSwitch = false,
}) => {
  const [activeTab, setActiveTab] = useState<PdfDepartmentTab>(initialTab);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Sync initialTab when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Handle ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { schoolInfo, solutionSelection, hardwareRequirement, contentConfiguration, projectMeta } = data;

  const getDocTitle = () => {
    switch (activeTab) {
      case 'HARDWARE':
        return `${projectMeta.projectId} - Hardware Requirement Specification (BOM)`;
      case 'TECH':
        return `${projectMeta.projectId} - Tech & Solutions Requirement Specification`;
      case 'CONTENT':
        return `${projectMeta.projectId} - Content Configuration Specification`;
      default:
        return `${projectMeta.projectId} - Consolidated Order Requirement Specification`;
    }
  };

  const handlePrint = () => {
    if (!printAreaRef.current) return;
    const printContent = printAreaRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=750');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${getDocTitle()}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4;
              margin: 14mm 12mm 14mm 12mm;
            }
            body {
              font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
              color: #333333;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            h1, h2, h3, h4, .font-heading {
              font-family: 'Montserrat', sans-serif;
              color: #3a7d84;
            }
            .page-break-inside-avoid {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            @media print {
              .no-print { display: none !important; }
              body { background: white !important; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          </style>
        </head>
        <body class="p-4 bg-white">
          ${printContent}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };



  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center p-2 sm:p-4 md:p-6 font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-5xl max-h-[94vh] bg-[#f8fafb] rounded-2xl shadow-xl flex flex-col z-10 overflow-hidden border border-slate-300">
        {/* Top Control Bar — Styled with Global Theme Slate & Teal */}
        <div className="bg-[#2f4154] text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-[#3a7d84]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#51a8b1] text-white flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#51a8b1]/20 text-[#51a8b1] border border-[#51a8b1]/40 uppercase">
                  Stage 03 Handover
                </span>
                <span className="text-xs font-semibold text-slate-300 font-mono">
                  {projectMeta.projectId}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight font-heading">
                {activeTab === 'HARDWARE'
                  ? 'Hardware Requirement Document'
                  : activeTab === 'TECH'
                  ? 'Tech & Solutions Requirement Document'
                  : activeTab === 'CONTENT'
                  ? 'Content Configuration Document'
                  : 'Order Requirement Master Dossier'}
              </h2>
            </div>
          </div>

          {/* Document Type Badge (Department-locked, No cross-department clash) */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-xs font-semibold text-[#51a8b1]">
            {activeTab === 'HARDWARE' && (
              <>
                <Cpu className="w-3.5 h-3.5 text-[#51a8b1]" />
                <span className="text-white">Hardware Only</span>
              </>
            )}
            {activeTab === 'TECH' && (
              <>
                <Layers className="w-3.5 h-3.5 text-[#51a8b1]" />
                <span className="text-white">Tech Only</span>
              </>
            )}
            {activeTab === 'CONTENT' && (
              <>
                <BookOpen className="w-3.5 h-3.5 text-[#51a8b1]" />
                <span className="text-white">Content Only</span>
              </>
            )}
            {activeTab === 'ALL' && (
              <>
                <ClipboardList className="w-3.5 h-3.5 text-[#51a8b1]" />
                <span className="text-white">Master Dossier</span>
              </>
            )}
          </div>

          {/* Action Buttons: Print, Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#51a8b1] hover:bg-[#3a7d84] text-white text-xs font-semibold transition shadow-xs cursor-pointer active:scale-95"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-900/40 hover:text-rose-300 text-slate-300 flex items-center justify-center transition cursor-pointer border border-slate-700"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container (Clean Paper Format) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex justify-center bg-[#f8fafb]">
          <div
            ref={printAreaRef}
            className="w-full max-w-4xl bg-white rounded-lg shadow-sm p-8 sm:p-12 border border-slate-300 text-[#333333] text-xs leading-relaxed space-y-6"
          >
            {/* ── Document Letterhead ─────────────────────────────── */}
            <div className="border-b-2 border-[#3a7d84] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[#3a7d84] uppercase">
                    DIGITOPPERS EDUTECH PRIVATE LIMITED
                  </h1>
                  <p className="text-xs text-[#4a5462] font-medium mt-0.5">
                    {activeTab === 'HARDWARE'
                      ? 'Stage 03 Hardware Requirements Handover & Equipment Bill of Materials'
                      : activeTab === 'TECH'
                      ? 'Stage 03 Tech & Solutions Requirements Handover & Site Infrastructure Specification'
                      : activeTab === 'CONTENT'
                      ? 'Stage 03 Content Configuration Handover & Curriculum Matrix'
                      : 'Stage 03 Order Requirement Consolidated Handover Dossier'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-xs text-[#2f4154] bg-[#f8fafb] px-2.5 py-1 rounded border border-slate-300">
                    {projectMeta.projectId}
                  </div>
                  <span className="text-[10px] text-[#4a5462] font-medium block mt-1">
                    Date: {currentDate}
                  </span>
                </div>
              </div>

              {/* Project Summary Key-Values */}
              <div className="mt-4 p-3 bg-[#f8fafb] rounded border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-[#4a5462] block tracking-wider">
                    Project Title
                  </span>
                  <span className="text-xs font-semibold text-[#333333] line-clamp-1">
                    {projectMeta.projectName}
                  </span>
                </div>
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-[#4a5462] block tracking-wider">
                    Client / Organization
                  </span>
                  <span className="text-xs font-semibold text-[#333333] line-clamp-1">
                    {projectMeta.organization}
                  </span>
                </div>
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-[#4a5462] block tracking-wider">
                    Project Manager
                  </span>
                  <span className="text-xs font-semibold text-[#333333]">
                    {projectMeta.projectManagerName}
                  </span>
                </div>
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-[#4a5462] block tracking-wider">
                    Scope Status
                  </span>
                  <span className="text-[10.5px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified for Execution
                  </span>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════
                HARDWARE ONLY VIEW
            ════════════════════════════════════════════════════════ */}
            {activeTab === 'HARDWARE' && (
              <div className="space-y-5 page-break-inside-avoid">
                <div className="pb-1 border-b border-[#51a8b1] flex items-center justify-between">
                  <h2 className="font-heading text-xs font-bold text-[#3a7d84] uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#51a8b1]" />
                    Hardware Bill of Materials (BOM) & Equipment Specifications
                  </h2>
                  <span className="text-[10px] text-[#4a5462] font-mono">
                    {hardwareRequirement.itemsList.length} Item(s) Allocated
                  </span>
                </div>

                {hardwareRequirement.itemsList.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#f1f4f6] text-[#333333] font-bold border-b border-slate-200">
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Equipment / Product Description</th>
                          <th className="py-2 px-3">Catalog Key</th>
                          <th className="py-2 px-3 text-center">Required Qty</th>
                          <th className="py-2 px-3">Specification Notes</th>
                          <th className="py-2 px-3 text-right">Allocation Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {hardwareRequirement.itemsList.map((hw, idx) => (
                          <tr key={hw.key || idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono text-[#4a5462]">{idx + 1}</td>
                            <td className="py-2 px-3 font-semibold text-[#333333]">
                              {hw.name}
                            </td>
                            <td className="py-2 px-3 font-mono text-[10px] text-[#4a5462]">
                              {hw.key}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-[#3a7d84] bg-slate-50">
                              {hw.quantity}
                            </td>
                            <td className="py-2 px-3 text-[#4a5462]">
                              {hw.specNotes || 'Standard hardware specifications apply'}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span className="text-[10px] font-bold text-emerald-700">
                                Allocated
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 bg-[#f8fafb] rounded border border-slate-200 text-[#4a5462] text-[11px]">
                    No hardware products were recorded in Stage 3.
                  </div>
                )}

                {/* School-Wise Hardware Allocation / Delivery Distribution */}
                {schoolInfo.schools.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-heading font-bold text-xs text-[#3a7d84] uppercase tracking-wider">
                      School-Wise Equipment Delivery & Installation Sites ({schoolInfo.schools.length} Campus Locations)
                    </h3>
                    <div className="overflow-x-auto border border-slate-200 rounded">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#f1f4f6] text-[#333333] font-bold border-b border-slate-200">
                            <th className="py-1.5 px-2.5">#</th>
                            <th className="py-1.5 px-2.5">Campus Name</th>
                            <th className="py-1.5 px-2.5">Site Location & Address</th>
                            <th className="py-1.5 px-2.5">Site Contact Person</th>
                            <th className="py-1.5 px-2.5">Phone</th>
                            <th className="py-1.5 px-2.5 text-right">ICT Lab Ready</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {schoolInfo.schools.map((sch, sIdx) => (
                            <tr key={sch.id || sIdx} className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-2.5 font-mono text-[#4a5462]">{sIdx + 1}</td>
                              <td className="py-1.5 px-2.5 font-medium text-[#333333]">{sch.schoolName}</td>
                              <td className="py-1.5 px-2.5 text-[#4a5462]">{sch.address || 'Standard Site Address'}</td>
                              <td className="py-1.5 px-2.5 text-[#4a5462]">{sch.pocName || sch.contactPerson?.name || 'Site POC'}</td>
                              <td className="py-1.5 px-2.5 text-[#4a5462] font-mono text-[10px]">{sch.phone || sch.contactPerson?.phone || '—'}</td>
                              <td className="py-1.5 px-2.5 text-right font-semibold text-emerald-700">
                                {sch.ictLabAvailable || 'Yes'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {(hardwareRequirement.hardwareNotes || hardwareRequirement.remarks) && (
                  <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200 text-[11px] text-[#4a5462]">
                    <span className="font-bold text-[#333333]">Hardware Remarks: </span>
                    {hardwareRequirement.hardwareNotes || hardwareRequirement.remarks}
                  </div>
                )}

                {/* Hardware Verification Sign-off */}
                <div className="border-t-2 border-[#3a7d84] pt-4 mt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="border-t border-slate-300 pt-2">
                      <span className="text-[9.5px] uppercase font-bold text-[#4a5462] block">Prepared By</span>
                      <span className="text-xs font-bold text-[#333333]">Stage 03 Order Requirement Team</span>
                      <span className="text-[9px] text-[#4a5462] block mt-0.5">BOM & Allocation Finalized</span>
                    </div>
                    <div className="border-t border-slate-300 pt-2">
                      <span className="text-[9.5px] uppercase font-bold text-[#4a5462] block">Approved By</span>
                      <span className="text-xs font-bold text-[#333333]">{projectMeta.projectManagerName}</span>
                      <span className="text-[9px] text-[#4a5462] block mt-0.5">Project Manager Approval</span>
                    </div>
                    <div className="border-t border-slate-300 pt-2">
                      <span className="text-[9.5px] uppercase font-bold text-[#4a5462] block">Received By</span>
                      <span className="text-xs font-bold text-[#333333]">Hardware Logistics & QC Lead</span>
                      <span className="text-[9px] text-[#4a5462] block mt-0.5">Stage 04 Hardware Execution</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                TECH ONLY VIEW
            ════════════════════════════════════════════════════════ */}
            {activeTab === 'TECH' && (
              <div className="space-y-5 page-break-inside-avoid">
                <div className="pb-1 border-b border-[#51a8b1] flex items-center justify-between">
                  <h2 className="font-heading text-xs font-bold text-[#3a7d84] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#51a8b1]" />
                    Tech & Solutions Requirement Specification
                  </h2>
                  <span className="text-[10px] text-[#4a5462] font-mono">
                    {solutionSelection.solutionsList.length} Package(s) Configured
                  </span>
                </div>

                {solutionSelection.solutionsList.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#f1f4f6] text-[#333333] font-bold border-b border-slate-200">
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Solution Package</th>
                          <th className="py-2 px-3">Catalog Key</th>
                          <th className="py-2 px-3 text-center">Allocated Units</th>
                          <th className="py-2 px-3">Target Classes</th>
                          <th className="py-2 px-3">Curriculum Board</th>
                          <th className="py-2 px-3">Implementation Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {solutionSelection.solutionsList.map((sol, idx) => (
                          <tr key={sol.key || idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono text-[#4a5462]">{idx + 1}</td>
                            <td className="py-2 px-3 font-semibold text-[#333333]">
                              {sol.name}
                            </td>
                            <td className="py-2 px-3 font-mono text-[10px] text-[#4a5462]">
                              {sol.key}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-[#3a7d84] bg-slate-50">
                              {sol.quantity}
                            </td>
                            <td className="py-2 px-3 text-[#4a5462]">
                              {sol.targetClasses && sol.targetClasses.length > 0
                                ? sol.targetClasses.join(', ')
                                : 'All Configured Grades'}
                            </td>
                            <td className="py-2 px-3 text-[#4a5462]">
                              {sol.board || 'Universal'}
                            </td>
                            <td className="py-2 px-3 text-[#4a5462]">
                              {sol.notes || 'Standard deployment'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 bg-[#f8fafb] rounded border border-slate-200 text-[#4a5462] text-[11px]">
                    Standard school interactive software package applied.
                  </div>
                )}

                {/* Technical Infrastructure Readiness */}
                <div className="space-y-2">
                  <h3 className="font-heading font-bold text-xs text-[#3a7d84] uppercase tracking-wider">
                    School Site Technical & Network Infrastructure Readiness
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200">
                      <span className="text-[9.5px] font-bold text-[#4a5462] uppercase block">Power Supply & DG Backup</span>
                      <p className="text-xs font-medium text-[#333333] mt-0.5">
                        {schoolInfo.electricityInternetAvailability || '24/7 dedicated 3-phase grid power with silent DG backup'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200">
                      <span className="text-[9.5px] font-bold text-[#4a5462] uppercase block">Broadband & Network Facility</span>
                      <p className="text-xs font-medium text-[#333333] mt-0.5">
                        {schoolInfo.raw?.internetFacilityType || 'High-speed Optical Fiber Broadband with enterprise Wi-Fi connectivity'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200">
                      <span className="text-[9.5px] font-bold text-[#4a5462] uppercase block">ICT Lab Devices & Workstations</span>
                      <p className="text-xs font-medium text-[#333333] mt-0.5">
                        {schoolInfo.ictHardwareComponents || 'Core i5 Desktop Systems, 4K Interactive Panels & Online UPS'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200">
                      <span className="text-[9.5px] font-bold text-[#4a5462] uppercase block">Security & Device Storage</span>
                      <p className="text-xs font-medium text-[#333333] mt-0.5">
                        {schoolInfo.deviceStorage || schoolInfo.ictSecurityMeasures || 'Rack enclosures and lockboxes for OPS units and peripherals'}
                      </p>
                    </div>
                  </div>
                </div>

                {(solutionSelection.overallNotes || solutionSelection.remarks) && (
                  <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200 text-[11px] text-[#4a5462]">
                    <span className="font-bold text-[#333333]">Tech Scope Remarks: </span>
                    {solutionSelection.overallNotes || solutionSelection.remarks}
                  </div>
                )}

                {/* Tech Verification Sign-off */}
                <div className="border-t-2 border-[#3a7d84] pt-4 mt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="border-t border-slate-300 pt-2">
                      <span className="text-[9.5px] uppercase font-bold text-[#4a5462] block">Prepared By</span>
                      <span className="text-xs font-bold text-[#333333]">Stage 03 Order Requirement Team</span>
                      <span className="text-[9px] text-[#4a5462] block mt-0.5">Solutions Scope Verified</span>
                    </div>
                    <div className="border-t border-slate-300 pt-2">
                      <span className="text-[9.5px] uppercase font-bold text-[#4a5462] block">Approved By</span>
                      <span className="text-xs font-bold text-[#333333]">{projectMeta.projectManagerName}</span>
                      <span className="text-[9px] text-[#4a5462] block mt-0.5">Project Manager Approval</span>
                    </div>
                    <div className="border-t border-slate-300 pt-2">
                      <span className="text-[9.5px] uppercase font-bold text-[#4a5462] block">Received By</span>
                      <span className="text-xs font-bold text-[#333333]">Technical Implementation Lead</span>
                      <span className="text-[9px] text-[#4a5462] block mt-0.5">Stage 04 Tech Execution</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                CONTENT ONLY VIEW
            ════════════════════════════════════════════════════════ */}
            {activeTab === 'CONTENT' && (
              <div className="space-y-5 page-break-inside-avoid">
                <div className="pb-1 border-b border-[#51a8b1] flex items-center justify-between">
                  <h2 className="font-heading text-xs font-bold text-[#3a7d84] uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#51a8b1]" />
                    Content Configuration & Curriculum Specification
                  </h2>
                  <span className="text-[10px] text-[#4a5462] font-mono">
                    Curriculum Specification
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200">
                    <span className="text-[9.5px] font-bold text-[#4a5462] uppercase block">
                      Curriculum Board(s)
                    </span>
                    <span className="text-xs font-semibold text-[#333333]">
                      {contentConfiguration.curriculumBoard || 'CBSE & State Board Integrated'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200">
                    <span className="text-[9.5px] font-bold text-[#4a5462] uppercase block">
                      Grades / Classes Spectrum
                    </span>
                    <span className="text-xs font-semibold text-[#333333]">
                      {contentConfiguration.gradesConfigured || 'Grades 6 to 12'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200">
                    <span className="text-[9.5px] font-bold text-[#4a5462] uppercase block">
                      Language Mediums
                    </span>
                    <span className="text-xs font-semibold text-[#333333]">
                      {contentConfiguration.languages.length > 0
                        ? contentConfiguration.languages.join(', ')
                        : 'English, Hindi'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded bg-[#f8fafb] border border-slate-200 text-[11px] space-y-1.5">
                  <span className="font-bold text-[#333333] block">Subjects & Pedagogical Scope:</span>
                  <p className="text-[#4a5462] leading-relaxed">
                    {contentConfiguration.subjectsConfigured || 'Mathematics, Science, English, Computer Science & AI'}
                  </p>
                </div>

                <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200 grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="font-bold text-[#333333] block">Configured & Certified By:</span>
                    <span className="text-[#4a5462]">{contentConfiguration.configuredBy || 'Kavita Rao (Content Lead)'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#333333] block">LMS Readiness:</span>
                    <span className="text-emerald-700 font-semibold">Indexed in LMS offline image</span>
                  </div>
                </div>

                {contentConfiguration.remarks && (
                  <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200 text-[11px] text-[#4a5462]">
                    <span className="font-bold text-[#333333]">Content Configuration Notes: </span>
                    {contentConfiguration.remarks}
                  </div>
                )}

                {/* Content Verification Sign-off */}
                <div className="border-t-2 border-[#3a7d84] pt-4 mt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="border-t border-slate-300 pt-2">
                      <span className="text-[9.5px] uppercase font-bold text-[#4a5462] block">Prepared By</span>
                      <span className="text-xs font-bold text-[#333333]">Stage 03 Order Requirement Team</span>
                      <span className="text-[9px] text-[#4a5462] block mt-0.5">Curriculum Mapping Verified</span>
                    </div>
                    <div className="border-t border-slate-300 pt-2">
                      <span className="text-[9.5px] uppercase font-bold text-[#4a5462] block">Approved By</span>
                      <span className="text-xs font-bold text-[#333333]">{projectMeta.projectManagerName}</span>
                      <span className="text-[9px] text-[#4a5462] block mt-0.5">Project Manager Approval</span>
                    </div>
                    <div className="border-t border-slate-300 pt-2">
                      <span className="text-[9.5px] uppercase font-bold text-[#4a5462] block">Received By</span>
                      <span className="text-xs font-bold text-[#333333]">Content Development & QA Lead</span>
                      <span className="text-[9px] text-[#4a5462] block mt-0.5">Stage 04 Content Execution</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                FULL MASTER CONSOLIDATED VIEW (WHEN TAB IS 'ALL')
            ════════════════════════════════════════════════════════ */}
            {activeTab === 'ALL' && (
              <div className="space-y-6 page-break-inside-avoid">
                {/* 1. School Information */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <h3 className="font-heading font-bold text-xs text-[#3a7d84] uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#51a8b1]" />
                      1. School Information & Infrastructure Readiness
                    </h3>
                    <span className="text-[10px] text-[#4a5462] font-mono">
                      {schoolInfo.schools.length > 0 ? `${schoolInfo.schools.length} Campus Site(s)` : '1 Campus'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200">
                      <span className="text-[9.5px] font-bold text-[#4a5462] uppercase block">School Name</span>
                      <span className="text-xs font-semibold text-[#333333] line-clamp-2">{schoolInfo.schoolName}</span>
                    </div>

                    <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200">
                      <span className="text-[9.5px] font-bold text-[#4a5462] uppercase block">Principal / Head</span>
                      <span className="text-xs font-medium text-[#333333]">
                        {schoolInfo.principalName || 'Site Head'} {schoolInfo.principalDetails ? `(${schoolInfo.principalDetails})` : ''}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200">
                      <span className="text-[9.5px] font-bold text-[#4a5462] uppercase block">Site POC & Contact</span>
                      <span className="text-xs font-medium text-[#333333]">
                        {schoolInfo.pocName || 'Designated POC'} {schoolInfo.pocContact ? `• ${schoolInfo.pocContact}` : ''}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200">
                      <span className="text-[9.5px] font-bold text-[#4a5462] uppercase block">Student Count & Rooms</span>
                      <span className="text-xs font-medium text-[#333333]">
                        {schoolInfo.totalStudents ? `${schoolInfo.totalStudents} Students` : 'Enrolled'} • {schoolInfo.totalClassrooms ? `${schoolInfo.totalClassrooms} Classrooms` : 'Configured'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200">
                      <span className="text-[9.5px] font-bold text-[#4a5462] uppercase block">Power & Internet Availability</span>
                      <span className="text-xs font-medium text-[#333333]">
                        {schoolInfo.electricityInternetAvailability || '—'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200">
                      <span className="text-[9.5px] font-bold text-[#4a5462] uppercase block">ICT Lab Readiness</span>
                      <span className="text-xs font-medium text-[#333333]">
                        {schoolInfo.ictLabAvailable ? `ICT Lab Available: ${schoolInfo.ictLabAvailable}` : '—'}
                      </span>
                    </div>
                  </div>

                  {schoolInfo.addressContact && (
                    <div className="p-2 rounded bg-[#f8fafb] border border-slate-200 text-[11px] text-[#4a5462]">
                      <span className="font-bold text-[#333333]">Site Location & Address: </span>
                      {schoolInfo.addressContact}
                    </div>
                  )}

                  {schoolInfo.schools.length > 1 && (
                    <div className="mt-2 overflow-x-auto border border-slate-200 rounded">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#f1f4f6] text-[#333333] font-bold border-b border-slate-200">
                            <th className="py-1.5 px-2.5">#</th>
                            <th className="py-1.5 px-2.5">School Name</th>
                            <th className="py-1.5 px-2.5">Site POC</th>
                            <th className="py-1.5 px-2.5">Phone</th>
                            <th className="py-1.5 px-2.5 text-right">Students</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {schoolInfo.schools.map((sch, sIdx) => (
                            <tr key={sch.id || sIdx} className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-2.5 font-mono text-[#4a5462]">{sIdx + 1}</td>
                              <td className="py-1.5 px-2.5 font-medium text-[#333333]">{sch.schoolName}</td>
                              <td className="py-1.5 px-2.5 text-[#4a5462]">{sch.pocName || '—'}</td>
                              <td className="py-1.5 px-2.5 text-[#4a5462] font-mono text-[10px]">{sch.phone || '—'}</td>
                              <td className="py-1.5 px-2.5 text-right text-[#333333] font-mono">{sch.totalStudents || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 2. Solutions Scope */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <h3 className="font-heading font-bold text-xs text-[#3a7d84] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#51a8b1]" />
                      2. Solutions Selection & Implementation Scope
                    </h3>
                    <span className="text-[10px] text-[#4a5462] font-mono">
                      {solutionSelection.solutionsList.length} Package(s)
                    </span>
                  </div>

                  {solutionSelection.solutionsList.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 rounded">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#f1f4f6] text-[#333333] font-bold border-b border-slate-200">
                            <th className="py-1.5 px-2.5">#</th>
                            <th className="py-1.5 px-2.5">Solution Package</th>
                            <th className="py-1.5 px-2.5">System Key</th>
                            <th className="py-1.5 px-2.5 text-center">Allocated Units</th>
                            <th className="py-1.5 px-2.5">Target Classes</th>
                            <th className="py-1.5 px-2.5">Curriculum Board</th>
                            <th className="py-1.5 px-2.5">Implementation Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {solutionSelection.solutionsList.map((sol, idx) => (
                            <tr key={sol.key || idx} className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-2.5 font-mono text-[#4a5462]">{idx + 1}</td>
                              <td className="py-1.5 px-2.5 font-semibold text-[#333333]">
                                {sol.name}
                              </td>
                              <td className="py-1.5 px-2.5 font-mono text-[10px] text-[#4a5462]">
                                {sol.key}
                              </td>
                              <td className="py-1.5 px-2.5 text-center font-mono font-bold text-[#3a7d84]">
                                {sol.quantity}
                              </td>
                              <td className="py-1.5 px-2.5 text-[#4a5462]">
                                {sol.targetClasses && sol.targetClasses.length > 0
                                  ? sol.targetClasses.join(', ')
                                  : 'All Configured Grades'}
                              </td>
                              <td className="py-1.5 px-2.5 text-[#4a5462]">
                                {sol.board || 'Universal'}
                              </td>
                              <td className="py-1.5 px-2.5 text-[#4a5462]">
                                {sol.notes || 'Standard deployment'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>

                {/* 3. Hardware Requirements BOM */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <h3 className="font-heading font-bold text-xs text-[#3a7d84] uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#51a8b1]" />
                      3. Hardware Bill of Materials (BOM) & Equipment Specifications
                    </h3>
                    <span className="text-[10px] text-[#4a5462] font-mono">
                      {hardwareRequirement.itemsList.length} Item(s) Allocated
                    </span>
                  </div>

                  {hardwareRequirement.itemsList.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 rounded">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#f1f4f6] text-[#333333] font-bold border-b border-slate-200">
                            <th className="py-1.5 px-2.5">#</th>
                            <th className="py-1.5 px-2.5">Equipment / Product Description</th>
                            <th className="py-1.5 px-2.5">Item Key</th>
                            <th className="py-1.5 px-2.5 text-center">Required Qty</th>
                            <th className="py-1.5 px-2.5">Specification / Model Notes</th>
                            <th className="py-1.5 px-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {hardwareRequirement.itemsList.map((hw, idx) => (
                            <tr key={hw.key || idx} className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-2.5 font-mono text-[#4a5462]">{idx + 1}</td>
                              <td className="py-1.5 px-2.5 font-semibold text-[#333333]">
                                {hw.name}
                              </td>
                              <td className="py-1.5 px-2.5 font-mono text-[10px] text-[#4a5462]">
                                {hw.key}
                              </td>
                              <td className="py-1.5 px-2.5 text-center font-mono font-bold text-[#3a7d84]">
                                {hw.quantity}
                              </td>
                              <td className="py-1.5 px-2.5 text-[#4a5462]">
                                {hw.specNotes || '—'}
                              </td>
                              <td className="py-1.5 px-2.5 text-right">
                                <span className="text-[10px] font-bold text-emerald-700">
                                  Allocated
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>

                {/* 4. Content Configuration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <h3 className="font-heading font-bold text-xs text-[#3a7d84] uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#51a8b1]" />
                      4. Content & Curriculum Configuration Matrix
                    </h3>
                    <span className="text-[10px] text-[#4a5462] font-mono">
                      Curriculum Specification
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200">
                      <span className="text-[9.5px] font-bold text-[#4a5462] uppercase block">
                        Curriculum Board(s)
                      </span>
                      <span className="text-xs font-semibold text-[#333333]">
                        {contentConfiguration.curriculumBoard || '—'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200">
                      <span className="text-[9.5px] font-bold text-[#4a5462] uppercase block">
                        Grades / Classes Spectrum
                      </span>
                      <span className="text-xs font-semibold text-[#333333]">
                        {contentConfiguration.gradesConfigured || '—'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200">
                      <span className="text-[9.5px] font-bold text-[#4a5462] uppercase block">
                        Language Mediums
                      </span>
                      <span className="text-xs font-semibold text-[#333333]">
                        {contentConfiguration.languages.length > 0
                          ? contentConfiguration.languages.join(', ')
                          : (contentConfiguration.curriculumBoard ? 'Indexed in curriculum' : '—')}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-[#f8fafb] border border-slate-200 text-[11px] space-y-1">
                    <span className="font-bold text-[#333333] block">Subjects & Pedagogical Scope:</span>
                    <p className="text-[#4a5462]">{contentConfiguration.subjectsConfigured || '—'}</p>
                  </div>
                </div>

                {/* Master Sign-off */}
                <div className="border-t-2 border-[#3a7d84] pt-5 mt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="border-t border-slate-300 pt-2">
                      <span className="text-[9.5px] uppercase font-bold text-[#4a5462] block">Prepared By</span>
                      <span className="text-xs font-bold text-[#333333]">Stage 03 Order Requirement Team</span>
                      <span className="text-[9px] text-[#4a5462] block mt-0.5">Specifications Captured</span>
                    </div>

                    <div className="border-t border-slate-300 pt-2">
                      <span className="text-[9.5px] uppercase font-bold text-[#4a5462] block">Approved By</span>
                      <span className="text-xs font-bold text-[#333333]">{projectMeta.projectManagerName}</span>
                      <span className="text-[9px] text-[#4a5462] block mt-0.5">Project Manager Review</span>
                    </div>

                    <div className="border-t border-slate-300 pt-2">
                      <span className="text-[9.5px] uppercase font-bold text-[#4a5462] block">Received & Executing</span>
                      <span className="text-xs font-bold text-[#333333]">Stage 04 Execution Leads</span>
                      <span className="text-[9px] text-[#4a5462] block mt-0.5">Hardware • Tech • Content</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[9px] text-[#4a5462] font-mono pt-3 border-t border-slate-200">
              <span>DIGITOPPERS OPERATIONS DOSSIER • CONFIDENTIAL & PROPRIETARY</span>
              <span>AUTHENTICATED STAGE 03 HANDOVER • {currentDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
