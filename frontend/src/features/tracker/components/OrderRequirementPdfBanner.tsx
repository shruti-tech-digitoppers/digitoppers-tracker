'use client';

import React, { useState } from 'react';
import { ITimelineNode } from '../../../types/timeline';
import { IProject } from '../../../types/project';
import {
  Stage3ExtractedData,
  extractStage3OrderRequirementData
} from '../utils/stage3RequirementExtractor';
import { OrderRequirementPdfModal, PdfDepartmentTab } from './OrderRequirementPdfModal';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  BookOpen,
  ExternalLink
} from 'lucide-react';

interface OrderRequirementPdfBannerProps {
  node: ITimelineNode;
  allNodes: ITimelineNode[];
  project: IProject | null;
  allFormData?: Record<string, any>;
}

export const OrderRequirementPdfBanner: React.FC<OrderRequirementPdfBannerProps> = ({
  node,
  allNodes,
  project,
  allFormData = {},
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<PdfDepartmentTab>('ALL');
  const [isExpandedSummary, setIsExpandedSummary] = useState(false);

  // All hooks must run unconditionally before any conditional return statements!
  const data: Stage3ExtractedData = React.useMemo(() => {
    return extractStage3OrderRequirementData(allNodes, project, allFormData);
  }, [allNodes, project, allFormData]);

  const nodeKey = (node.key || '').toUpperCase();
  const parentNode = node.parent ? allNodes.find(n => n._id === node.parent || n.key === node.parent) : null;
  const parentKey = (parentNode?.key || '').toUpperCase();

  // 1. Strictly exclude Stage 03 (Order Requirement input forms) and other non-execution stages
  const isStage3Node = [
    'ORDER_REQUIREMENT',
    'STAGE_3',
    'STAGE_03',
    'SCHOOL_INFO',
    'SCHOOL_INFORMATION',
    'SOLUTIONS',
    'SOLUTION_SELECTION',
    'HARDWARE_REQUIREMENT',
    'CONTENT_CONFIG',
    'CONTENT_CONFIGURATION'
  ].includes(nodeKey) ||
    nodeKey.startsWith('ORDER_REQ') ||
    parentKey === 'ORDER_REQUIREMENT' ||
    parentKey === 'STAGE_3' ||
    parentKey === 'STAGE_03';

  // 2. Strictly identify Stage 04 execution stream nodes ONLY:
  const isHardware = [
    'HARDWARE_STREAM',
    'REQ_AND_STOCK_CHECK',
    'PURCHASE_IF_NEEDED',
    'CONSIGNMENT_TRACKING',
    'HARDWARE_READY'
  ].includes(nodeKey) || parentKey === 'HARDWARE_STREAM';

  const isTech = [
    'TECH_STREAM',
    'PROJECT_CONFIG_AND_IMPLEMENTATION',
    'TECH_TESTING'
  ].includes(nodeKey) || parentKey === 'TECH_STREAM';

  const isContent = [
    'CONTENT_STREAM',
    'CONTENT_REVIEW_QA',
    'SHEET_READINESS',
    'DUMP_READINESS',
    'CONTENT_READY'
  ].includes(nodeKey) || parentKey === 'CONTENT_STREAM';

  const openPdfWithTab = (tab: PdfDepartmentTab) => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  // Do NOT render for Stage 03, root nodes (EXECUTION) or other stages (Stage 1, 2, 5, 6)
  if (isStage3Node || (!isHardware && !isTech && !isContent)) {
    return null;
  }

  const defaultDepartmentTab: PdfDepartmentTab = isHardware
    ? 'HARDWARE'
    : isTech
    ? 'TECH'
    : 'CONTENT';

  const deptTitle = isHardware
    ? 'Hardware Requirements (BOM)'
    : isTech
    ? 'Tech & Solutions Scope'
    : 'Content Configuration Matrix';

  const deptDesc = isHardware
    ? 'BOM equipment quantities & specifications from Stage 03'
    : isTech
    ? 'Software solutions, licenses & school technical readiness'
    : 'Curriculum boards, grades, subjects & language mediums';

  const DeptIcon = isHardware ? Cpu : isTech ? Layers : BookOpen;

  return (
    <>
      <div className="p-3.5 rounded-xl border border-slate-200 bg-[#f8fafb] shadow-2xs transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Department and Stage description */}
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#51a8b1]/15 text-[#3a7d84] flex items-center justify-center shrink-0 mt-0.5 border border-[#51a8b1]/30">
              <DeptIcon className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#51a8b1]/15 text-[#3a7d84] border border-[#51a8b1]/30 uppercase">
                  Stage 03 Handover
                </span>
                <span className="text-[10px] font-medium text-[#4a5462]">
                  Transitioned to {node.name}
                </span>
              </div>

              <h4 className="font-heading font-bold text-xs text-[#3a7d84] tracking-tight leading-tight">
                {deptTitle}
              </h4>
              <p className="text-[11px] text-[#4a5462] mt-0.5 line-clamp-1">
                {deptDesc}
              </p>
            </div>
          </div>

          {/* Right: PDF Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openPdfWithTab(defaultDepartmentTab)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#51a8b1] hover:bg-[#3a7d84] transition shadow-2xs cursor-pointer active:scale-95"
              title={`Open ${deptTitle} in PDF form`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View {isHardware ? 'Hardware Req PDF' : isTech ? 'Tech Req PDF' : isContent ? 'Content Req PDF' : 'Master Execution Dossier'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExpandedSummary(!isExpandedSummary)}
              className="p-1.5 rounded-lg text-[#4a5462] hover:text-[#333333] hover:bg-white border border-slate-200 transition cursor-pointer"
              title={isExpandedSummary ? 'Collapse handover summary' : 'Expand handover summary'}
            >
              {isExpandedSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick Preview Chips Row */}
        <div className="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2 text-[11px]">
          {isHardware && (
            <>
              <span className="font-semibold text-[#333333]">Hardware BOM:</span>
              <span className="font-medium text-[#333333] bg-white px-2 py-0.5 rounded border border-slate-200">
                {data.hardwareRequirement.itemsList.length} Items Allocated
              </span>
              {data.hardwareRequirement.itemsList.slice(0, 3).map((item, idx) => (
                <span key={idx} className="bg-white text-[#4a5462] border border-slate-200 px-2 py-0.5 rounded text-[10.5px]">
                  {item.name} ({item.quantity})
                </span>
              ))}
              {data.hardwareRequirement.itemsList.length > 3 && (
                <span className="text-[#4a5462] text-[10.5px]">
                  +{data.hardwareRequirement.itemsList.length - 3} more
                </span>
              )}
            </>
          )}

          {isTech && (
            <>
              <span className="font-semibold text-[#333333]">Solutions Scope:</span>
              <span className="font-medium text-[#333333] bg-white px-2 py-0.5 rounded border border-slate-200">
                {data.solutionSelection.solutionsList.length || 1} Solutions Configured
              </span>
              <span className="bg-white text-[#4a5462] border border-slate-200 px-2 py-0.5 rounded text-[10.5px]">
                {data.schoolInfo.schools.length || 1} School Sites
              </span>
              {data.solutionSelection.solutionsList.slice(0, 2).map((sol, idx) => (
                <span key={idx} className="bg-white text-[#4a5462] border border-slate-200 px-2 py-0.5 rounded text-[10.5px]">
                  {sol.name}
                </span>
              ))}
            </>
          )}

          {isContent && (
            <>
              <span className="font-semibold text-[#333333]">Curriculum:</span>
              <span className="font-medium text-[#333333] bg-white px-2 py-0.5 rounded border border-slate-200">
                {data.contentConfiguration.curriculumBoard}
              </span>
              <span className="bg-white text-[#4a5462] border border-slate-200 px-2 py-0.5 rounded text-[10.5px]">
                {data.contentConfiguration.gradesConfigured}
              </span>
            </>
          )}
        </div>

        {/* Collapsible Inline Detailed Summary Drawer */}
        {isExpandedSummary && (
          <div className="mt-3 pt-3 border-t border-slate-200 bg-white p-3 rounded-lg space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#333333] uppercase text-[10px]">
                Handover Summary Breakdown
              </span>
              <button
                type="button"
                onClick={() => openPdfWithTab(defaultDepartmentTab)}
                className="text-[#3a7d84] hover:text-[#51a8b1] font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full PDF Document</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Department-Tailored Summary Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {isHardware ? (
                <>
                  <div className="p-2 rounded bg-[#f8fafb] border border-slate-200">
                    <span className="font-semibold text-[#4a5462] text-[10px] uppercase block mb-0.5">
                      1. Hardware Equipment & BOM
                    </span>
                    <p className="font-medium text-[#333333]">
                      {data.hardwareRequirement.itemsList.length} Products Specified
                    </p>
                    <p className="text-[11px] text-[#4a5462] mt-0.5 line-clamp-1">
                      {data.hardwareRequirement.itemsList.map(h => `${h.name} (${h.quantity})`).join(', ') || 'Standard BOM'}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-[#f8fafb] border border-slate-200">
                    <span className="font-semibold text-[#4a5462] text-[10px] uppercase block mb-0.5">
                      2. Delivery Sites & Campuses
                    </span>
                    <p className="font-medium text-[#333333] line-clamp-1">
                      {data.schoolInfo.schools.length > 0 ? `${data.schoolInfo.schools.length} School Campus Locations` : data.schoolInfo.schoolName}
                    </p>
                    <p className="text-[11px] text-[#4a5462] mt-0.5">
                      POC: {data.schoolInfo.pocName || 'Campus Head'} {data.schoolInfo.pocContact ? `(${data.schoolInfo.pocContact})` : ''}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-[#f8fafb] border border-slate-200">
                    <span className="font-semibold text-[#4a5462] text-[10px] uppercase block mb-0.5">
                      3. Hardware Allocation Status
                    </span>
                    <p className="font-medium text-emerald-700">
                      {data.hardwareRequirement.allocationStatus || 'Allocated for Execution'}
                    </p>
                    <p className="text-[10px] text-[#4a5462] mt-0.5">
                      Assigned Lead: {data.hardwareRequirement.assignedHardwareManager || 'Hardware In-charge'}
                    </p>
                  </div>
                </>
              ) : isTech ? (
                <>
                  <div className="p-2 rounded bg-[#f8fafb] border border-slate-200">
                    <span className="font-semibold text-[#4a5462] text-[10px] uppercase block mb-0.5">
                      1. Software Solutions
                    </span>
                    <p className="font-medium text-[#333333]">
                      {data.solutionSelection.solutionsList.length} Packages Configured
                    </p>
                    <p className="text-[11px] text-[#4a5462] mt-0.5 line-clamp-1">
                      {data.solutionSelection.solutionsList.map(s => `${s.name} (${s.quantity})`).join(', ') || 'Smart Classroom Software'}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-[#f8fafb] border border-slate-200">
                    <span className="font-semibold text-[#4a5462] text-[10px] uppercase block mb-0.5">
                      2. Electrical & Power Readiness
                    </span>
                    <p className="font-medium text-[#333333] line-clamp-1">
                      {data.schoolInfo.electricityInternetAvailability || 'Grid Power with Generator Backup'}
                    </p>
                    <p className="text-[11px] text-[#4a5462] mt-0.5">
                      Infrastructure verified for deployment
                    </p>
                  </div>
                  <div className="p-2 rounded bg-[#f8fafb] border border-slate-200">
                    <span className="font-semibold text-[#4a5462] text-[10px] uppercase block mb-0.5">
                      3. ICT Devices & Security
                    </span>
                    <p className="font-medium text-[#333333] line-clamp-1">
                      {data.schoolInfo.ictHardwareComponents || 'Core i5 Desktops & Interactive Panels'}
                    </p>
                    <p className="text-[10px] text-[#4a5462] mt-0.5">
                      Storage: {data.schoolInfo.deviceStorage || 'Rack enclosures'}
                    </p>
                  </div>
                </>
              ) : isContent ? (
                <>
                  <div className="p-2 rounded bg-[#f8fafb] border border-slate-200">
                    <span className="font-semibold text-[#4a5462] text-[10px] uppercase block mb-0.5">
                      1. Curriculum Board & Mediums
                    </span>
                    <p className="font-medium text-[#333333] line-clamp-1">
                      {data.contentConfiguration.curriculumBoard}
                    </p>
                    <p className="text-[11px] text-[#4a5462] mt-0.5">
                      Languages: {data.contentConfiguration.languages.join(', ') || 'English, Hindi'}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-[#f8fafb] border border-slate-200">
                    <span className="font-semibold text-[#4a5462] text-[10px] uppercase block mb-0.5">
                      2. Grades Spectrum
                    </span>
                    <p className="font-medium text-[#333333]">
                      {data.contentConfiguration.gradesConfigured}
                    </p>
                    <p className="text-[10px] text-emerald-700 mt-0.5 font-medium">
                      LMS Readiness: Indexed in LMS offline image
                    </p>
                  </div>
                  <div className="p-2 rounded bg-[#f8fafb] border border-slate-200">
                    <span className="font-semibold text-[#4a5462] text-[10px] uppercase block mb-0.5">
                      3. Subjects Scope
                    </span>
                    <p className="font-medium text-[#333333] line-clamp-1">
                      {data.contentConfiguration.subjectsConfigured}
                    </p>
                    <p className="text-[10px] text-[#4a5462] mt-0.5">
                      Certified By: {data.contentConfiguration.configuredBy || 'Content Lead'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 rounded bg-[#f8fafb] border border-slate-200">
                    <span className="font-semibold text-[#4a5462] text-[10px] uppercase block mb-0.5">
                      1. Site Onboarding
                    </span>
                    <p className="font-medium text-[#333333] line-clamp-1">{data.schoolInfo.schoolName}</p>
                    <p className="text-[11px] text-[#4a5462] mt-0.5">
                      POC: {data.schoolInfo.pocName || 'Site POC'} {data.schoolInfo.pocContact ? `(${data.schoolInfo.pocContact})` : ''}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-[#f8fafb] border border-slate-200">
                    <span className="font-semibold text-[#4a5462] text-[10px] uppercase block mb-0.5">
                      2. Equipment & BOM
                    </span>
                    <p className="font-medium text-[#333333]">
                      {data.hardwareRequirement.itemsList.length} Hardware Items Specified
                    </p>
                    <p className="text-[11px] text-[#4a5462] mt-0.5 line-clamp-1">
                      {data.hardwareRequirement.itemsList.map(h => h.name).join(', ') || 'Standard equipment'}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-[#f8fafb] border border-slate-200">
                    <span className="font-semibold text-[#4a5462] text-[10px] uppercase block mb-0.5">
                      3. Curriculum & Software
                    </span>
                    <p className="font-medium text-[#333333] line-clamp-1">
                      {data.contentConfiguration.curriculumBoard} • {data.contentConfiguration.gradesConfigured}
                    </p>
                    <p className="text-[11px] text-[#4a5462] mt-0.5 line-clamp-1">
                      {data.contentConfiguration.subjectsConfigured}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <OrderRequirementPdfModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={data}
        initialTab={modalTab}
        allowDepartmentSwitch={false}
      />
    </>
  );
};
