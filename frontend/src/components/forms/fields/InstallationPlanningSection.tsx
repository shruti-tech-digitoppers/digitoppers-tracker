'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Building2,
  Calendar,
  UserCheck,
  UserPlus,
  Trash2,
  MapPin,
  Phone,
  User,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Wrench,
  Layers,
  Copy,
  Check,
  Bell,
  Send
} from 'lucide-react';
import { IUser } from '../../../types/auth';
import { IProject } from '../../../types/project';
import { InstitutionalSchoolSelector } from '../common/InstitutionalSchoolSelector';
import { extractEffectiveSchools, EffectiveSchoolItem } from '../utils/formHelpers';
import { employeesApi } from '../../../lib/api/employees.api';
import { notificationsApi } from '../../../lib/api/notifications.api';

export interface ISchoolTrainer {
  id?: string;
  trainerId?: string; // Foreign key / employee ID (MongoDB _id)
  name: string;
  employeeCode?: string;
  role?: string; // e.g. "Trainer 1 (Lead Field Engineer)", "Assistant Trainer"
  phone?: string;
  email?: string;
  designation?: string;
}

export interface ISchoolInstallationPlan {
  schoolId: string; // Foreign key reference to School collection
  schoolName: string;
  address: string;
  contactPerson?: string;
  contactPhone?: string;
  // Installation Planning fields
  technicalPersonId?: string;
  technicalPersonName?: string;
  contactNumber?: string;
  datePlannedForInstallation?: string; // YYYY-MM-DD
  plannedInstallationDate?: string; // YYYY-MM-DD
  // Training Planning fields
  planOutDate?: string; // YYYY-MM-DD
  trainers?: ISchoolTrainer[];
  status?: 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  remarks?: string;
}

interface InstallationPlanningSectionProps {
  value?: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  employees?: IUser[];
  allFormData?: Record<string, any>;
  project?: IProject | null;
  schools?: any[];
  isTrainingContext?: boolean;
}

export function InstallationPlanningSection({
  value,
  onChange,
  disabled = false,
  employees = [],
  allFormData = {},
  project = null,
  schools = [],
  isTrainingContext = false,
}: InstallationPlanningSectionProps) {
  // 1. Determine effective schools list using the unified helper
  const effectiveSchools = useMemo<EffectiveSchoolItem[]>(() => {
    return extractEffectiveSchools(schools, allFormData, value);
  }, [schools, allFormData, value]);

  const [activeSchoolIndex, setActiveSchoolIndex] = useState<number>(0);

  const currentSchool =
    effectiveSchools[Math.min(activeSchoolIndex, effectiveSchools.length - 1)] ||
    effectiveSchools[0] || { id: 'school-1', name: 'Primary School' };

  // 2. Fallback fetch active employees if props array is empty
  const [fetchedEmployees, setFetchedEmployees] = useState<IUser[]>([]);
  const [notifying, setNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState<string | null>(null);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [customTrainerRows, setCustomTrainerRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!employees || employees.length === 0) {
      employeesApi
        .getEmployees({ isActive: true })
        .then((res) => {
          if (res && res.success && Array.isArray(res.employees)) {
            setFetchedEmployees(res.employees);
          }
        })
        .catch((err) => {
          console.error('Failed to load employees for installation section:', err);
        });
    }
  }, [employees]);

  // Merged employee roster
  const allEmployeesList = useMemo<IUser[]>(() => {
    return employees && employees.length > 0 ? employees : fetchedEmployees;
  }, [employees, fetchedEmployees]);

  // Group employees: Installation & Field Team vs General Team
  const { installationEmployees, otherEmployees } = useMemo(() => {
    const install: IUser[] = [];
    const other: IUser[] = [];

    allEmployeesList.forEach((e) => {
      const dept = (
        (e as any).departmentCode ||
        (e as any).department?.code ||
        (e as any).department?.name ||
        (e as any).department ||
        ''
      ).toUpperCase();
      const desig = (e.designation || '').toLowerCase();

      if (
        dept === 'INSTALLATION' ||
        dept === 'TRAINING' ||
        dept === 'OPS' ||
        desig.includes('engineer') ||
        desig.includes('trainer') ||
        desig.includes('field') ||
        desig.includes('installation') ||
        desig.includes('tech')
      ) {
        install.push(e);
      } else {
        other.push(e);
      }
    });

    if (isTrainingContext) {
      // Sort training employees & trainers to top
      install.sort((a, b) => {
        const aDept = ((a as any).departmentCode || '').toUpperCase();
        const bDept = ((b as any).departmentCode || '').toUpperCase();
        const aDesig = (a.designation || '').toLowerCase();
        const bDesig = (b.designation || '').toLowerCase();
        const aIsTrainer = aDept === 'TRAINING' || aDesig.includes('trainer');
        const bIsTrainer = bDept === 'TRAINING' || bDesig.includes('trainer');
        if (aIsTrainer && !bIsTrainer) return -1;
        if (!aIsTrainer && bIsTrainer) return 1;
        return 0;
      });
    }

    return { installationEmployees: install, otherEmployees: other };
  }, [allEmployeesList, isTrainingContext]);

  // Helper to match an employee by ID or name
  const findEmployee = useCallback(
    (empId?: string, name?: string) => {
      if (empId) {
        const match = allEmployeesList.find((e) => e._id === empId);
        if (match) return match;
      }
      if (name) {
        const cleanName = name.toLowerCase().trim();
        const match = allEmployeesList.find(
          (e) => e.name?.toLowerCase().trim() === cleanName
        );
        if (match) return match;
      }
      return null;
    },
    [allEmployeesList]
  );

  // Helper to extract or initialize school plans map from value & effectiveSchools
  const extractPlansMap = useCallback(
    (sourceValue: any, schoolsList: EffectiveSchoolItem[]) => {
      const map: Record<string, ISchoolInstallationPlan> = {};

      // 1. From map sources
      const rawMap =
        sourceValue?.schoolWiseTrainingPlans ||
        sourceValue?.schoolWiseInstallationPlans ||
        (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) && !sourceValue.trainingPlanning && !sourceValue.plannedSchools ? sourceValue : null);

      if (rawMap && typeof rawMap === 'object' && !Array.isArray(rawMap)) {
        Object.entries(rawMap).forEach(([k, v]: [string, any]) => {
          if (v && typeof v === 'object' && (v.schoolId || v.schoolName || v.trainers)) {
            map[k] = v;
            if (v.schoolId && !map[v.schoolId]) map[v.schoolId] = v;
          }
        });
      }

      // 2. From array sources
      const rawArray =
        (Array.isArray(sourceValue) ? sourceValue : null) ||
        (Array.isArray(sourceValue?.trainingPlanning) ? sourceValue.trainingPlanning : null) ||
        (Array.isArray(sourceValue?.plannedSchools) ? sourceValue.plannedSchools : null) ||
        (Array.isArray(sourceValue?.installationPlanning) ? sourceValue.installationPlanning : null);

      if (Array.isArray(rawArray) && rawArray.length > 0) {
        rawArray.forEach((p: ISchoolInstallationPlan) => {
          if (p && p.schoolId) {
            map[p.schoolId] = p;
          }
        });
      }

      // 3. For every effective school, ensure a plan exists (pulling from DB if available)
      schoolsList.forEach((sch, sIdx) => {
        const found =
          map[sch.id] ||
          (sch.school ? map[String(sch.school)] : null) ||
          Object.values(map).find((p: any) =>
            (p.schoolId && (p.schoolId === sch.id || p.schoolId === String(sch.school))) ||
            (p.schoolName && sch.name && p.schoolName.toLowerCase().trim() === sch.name.toLowerCase().trim())
          );

        const rawInstDate = (!isTrainingContext ? (sch.installation?.planOutDate || sch.installation?.scheduledDate) : '') || sch.training?.planOutDate || '';
        const dbPlanDate = rawInstDate ? (typeof rawInstDate === 'string' ? rawInstDate.split('T')[0] : new Date(rawInstDate).toISOString().split('T')[0]) : '';

        if (found) {
          const rawFoundDate = found.datePlannedForInstallation || found.planOutDate || found.plannedInstallationDate || dbPlanDate || '';
          const cleanDate = rawFoundDate ? (typeof rawFoundDate === 'string' ? rawFoundDate.split('T')[0] : new Date(rawFoundDate).toISOString().split('T')[0]) : '';
          map[sch.id] = {
            ...found,
            schoolId: sch.id,
            schoolName: sch.name || found.schoolName,
            address: sch.address || found.address,
            datePlannedForInstallation: cleanDate,
            planOutDate: cleanDate,
            plannedInstallationDate: cleanDate,
            trainers: found.trainers && found.trainers.length > 0 ? found.trainers : (sch.trainers || sch.training?.trainers || [])
          };
        } else {
          // Check DB training/installation info
          const dbTrainerId = (!isTrainingContext ? (sch.installation?.assignedEngineerId?._id || sch.installation?.assignedEngineerId) : '') ||
            sch.training?.assignedTrainerId?._id || sch.training?.assignedTrainerId || sch.training?.trainer || '';
          const dbTrainerName = (!isTrainingContext ? (sch.installation?.assignedEngineerId?.name || sch.installation?.engineerName) : '') ||
            sch.training?.assignedTrainerId?.name || sch.training?.trainerName || '';
          const dbTrainerPhone = (!isTrainingContext ? (sch.installation?.assignedEngineerId?.phone || sch.installation?.engineerContact) : '') ||
            sch.training?.assignedTrainerId?.phone || sch.training?.trainerPhone || '';
          const dbTrainers = sch.training?.trainers || sch.trainers || [];

          const defaultEmp =
            installationEmployees[sIdx % (installationEmployees.length || 1)] ||
            allEmployeesList[0];

          // For Training context: start empty if nothing in DB. For Installation: use defaultEmp fallback.
          const tName = dbTrainerName || (isTrainingContext ? '' : defaultEmp?.name || 'Rahul Yadav');
          const tId = dbTrainerId || (isTrainingContext ? '' : defaultEmp?._id || '');
          const tPhone = dbTrainerPhone || (isTrainingContext ? '' : defaultEmp?.phone || '9811001105');
          const tCode = isTrainingContext ? '' : defaultEmp?.employeeCode || 'EMP014';

          map[sch.id] = {
            schoolId: sch.id,
            schoolName: sch.name,
            address: sch.address || 'Campus Location',
            contactPerson: sch.pocName || sch.contactPerson || 'Site Principal',
            contactPhone: sch.pocContact || '',
            technicalPersonId: tId,
            technicalPersonName: tName,
            contactNumber: tPhone,
            planOutDate: dbPlanDate,
            plannedInstallationDate: dbPlanDate,
            datePlannedForInstallation: dbPlanDate,
            status: 'SCHEDULED',
            trainers:
              dbTrainers.length > 0
                ? dbTrainers
                : [
                    {
                      id: `trainer_1_${sch.id}`,
                      trainerId: tId,
                      name: tName,
                      employeeCode: tCode,
                      phone: tPhone,
                      role: isTrainingContext ? 'Trainer 1 (Lead Trainer)' : 'Trainer 1 (Lead Field Engineer)'
                    },
                  ],
          };
        }
      });

      return map;
    },
    [isTrainingContext, installationEmployees, allEmployeesList]
  );

  // 3. School-wise installation plans map keyed by schoolId (Foreign Key reference)
  const [schoolPlansMap, setSchoolPlansMap] = useState<Record<string, ISchoolInstallationPlan>>(() => {
    return extractPlansMap(value, effectiveSchools);
  });

  // Keep schoolPlansMap in sync when value or effectiveSchools changes from outside
  useEffect(() => {
    if (!value) return;
    const freshMap = extractPlansMap(value, effectiveSchools);
    setSchoolPlansMap((prev) => {
      const merged = { ...freshMap };
      Object.keys(prev).forEach((k) => {
        if (prev[k]?.trainers && prev[k].trainers.length > 0) {
          if (!freshMap[k]?.trainers || freshMap[k].trainers.length === 0) {
            merged[k] = prev[k];
          }
        }
      });
      return merged;
    });
  }, [value, effectiveSchools, extractPlansMap]);

  // Synchronize update up to parent form
  const emitUpdate = useCallback(
    (nextMap: Record<string, ISchoolInstallationPlan>) => {
      const plannedSchoolsList = effectiveSchools.map((sch) => {
        const item = nextMap[sch.id];
        return (
          item || {
            schoolId: sch.id,
            schoolName: sch.name,
            address: sch.address || '',
            contactPerson: sch.pocName || sch.contactPerson || '',
            contactPhone: sch.pocContact || '',
            technicalPersonId: '',
            technicalPersonName: '',
            contactNumber: '',
            planOutDate: '',
            status: 'SCHEDULED',
            trainers: [],
          }
        );
      });

      const firstPlan = plannedSchoolsList[0];
      const allTrainerNames = plannedSchoolsList
        .flatMap((p) => (p.trainers || []).map((t) => t.name))
        .filter(Boolean)
        .join(', ');

      const allTechNames = plannedSchoolsList
        .map((p) => p.technicalPersonName || p.trainers?.[0]?.name)
        .filter(Boolean)
        .join(', ');

      onChange({
        schoolWiseTrainingPlans: nextMap,
        schoolWiseInstallationPlans: nextMap,
        plannedSchools: plannedSchoolsList,
        trainingPlanning: plannedSchoolsList,
        installationPlanning: plannedSchoolsList,
        // Root-level fields for backwards compatibility and easy display
        technicalPerson: firstPlan?.technicalPersonName || firstPlan?.trainers?.[0]?.name || '',
        technicalPersonId: firstPlan?.technicalPersonId || firstPlan?.trainers?.[0]?.trainerId || '',
        contactNumber: firstPlan?.contactNumber || firstPlan?.trainers?.[0]?.phone || '',
        leadEngineer: firstPlan?.technicalPersonName || firstPlan?.trainers?.[0]?.name || '',
        phone: firstPlan?.contactNumber || firstPlan?.trainers?.[0]?.phone || '',
        trainerName: allTrainerNames || allTechNames || '',
        trainingDate: firstPlan?.planOutDate || '',
        installationDate: firstPlan?.datePlannedForInstallation || firstPlan?.planOutDate || '',
        datePlannedForInstallation: firstPlan?.datePlannedForInstallation || firstPlan?.planOutDate || '',
        plannedInstallationDate: firstPlan?.plannedInstallationDate || firstPlan?.planOutDate || '',
        siteContact: firstPlan?.contactPerson || '',
        remarks: firstPlan?.remarks || '',
      });
    },
    [effectiveSchools, onChange]
  );

  // Active school's plan
  const currentSchoolPlan: ISchoolInstallationPlan = useMemo(() => {
    const existing =
      schoolPlansMap[currentSchool.id] ||
      (currentSchool._id ? schoolPlansMap[currentSchool._id] : null) ||
      Object.values(schoolPlansMap).find((p: any) =>
        (p.schoolId && (p.schoolId === currentSchool.id || p.schoolId === currentSchool._id || p.schoolId === String((currentSchool as any).school))) ||
        (p.schoolName && currentSchool.name && p.schoolName.toLowerCase().trim() === currentSchool.name.toLowerCase().trim())
      );

    if (existing) {
      return {
        ...existing,
        technicalPersonId: existing.technicalPersonId || existing.trainers?.[0]?.trainerId || '',
        technicalPersonName: existing.technicalPersonName || existing.trainers?.[0]?.name || '',
        contactNumber: existing.contactNumber || existing.trainers?.[0]?.phone || '',
      };
    }

    // Check if currentSchool has DB training data
    const dbTrainerId = currentSchool.training?.assignedTrainerId?._id || currentSchool.training?.assignedTrainerId || currentSchool.training?.trainer || '';
    const dbTrainerName = currentSchool.training?.assignedTrainerId?.name || currentSchool.training?.trainerName || '';
    const dbTrainerPhone = currentSchool.training?.assignedTrainerId?.phone || currentSchool.training?.trainerPhone || '';
    const dbPlanDate = currentSchool.training?.planOutDate || '';
    const dbTrainers = currentSchool.training?.trainers || currentSchool.trainers || [];

    const defaultEmp = installationEmployees[0] || allEmployeesList[0];
    const tName = dbTrainerName || (isTrainingContext ? '' : defaultEmp?.name || '');
    const tId = dbTrainerId || (isTrainingContext ? '' : defaultEmp?._id || '');
    const tPhone = dbTrainerPhone || (isTrainingContext ? '' : defaultEmp?.phone || '');
    const tCode = isTrainingContext ? '' : defaultEmp?.employeeCode || '';

    return {
      schoolId: currentSchool.id,
      schoolName: currentSchool.name,
      address: currentSchool.address || '',
      contactPerson: currentSchool.pocName || currentSchool.contactPerson || '',
      contactPhone: currentSchool.pocContact || '',
      technicalPersonId: tId,
      technicalPersonName: tName,
      contactNumber: tPhone,
      planOutDate: dbPlanDate,
      status: 'SCHEDULED',
      remarks: '',
      trainers:
        dbTrainers.length > 0
          ? dbTrainers
          : [
              {
                id: `trainer_1_${currentSchool.id}`,
                trainerId: tId,
                name: tName,
                employeeCode: tCode,
                phone: tPhone,
                role: isTrainingContext ? 'Trainer 1 (Lead Trainer)' : 'Trainer 1 (Lead Field Engineer)'
              },
            ],
    };
  }, [schoolPlansMap, currentSchool, installationEmployees, allEmployeesList, isTrainingContext]);

  // Handle single technical person selection for active school
  const handleSelectTechnicalPerson = useCallback(
    (empId: string) => {
      const matchedEmp = allEmployeesList.find((e) => e._id === empId);
      const nextPlan: ISchoolInstallationPlan = {
        ...currentSchoolPlan,
        technicalPersonId: matchedEmp ? matchedEmp._id : '',
        technicalPersonName: matchedEmp ? matchedEmp.name : '',
        contactNumber: matchedEmp?.phone || currentSchoolPlan.contactNumber || '',
        trainers: matchedEmp
          ? [
              {
                id: `trainer_1_${currentSchool.id}`,
                trainerId: matchedEmp._id,
                name: matchedEmp.name,
                employeeCode: matchedEmp.employeeCode || '',
                phone: matchedEmp.phone || '',
                role: matchedEmp.designation || 'Lead Field Engineer',
              },
            ]
          : [],
      };

      const nextMap = {
        ...schoolPlansMap,
        [currentSchool.id]: nextPlan,
      };
      setSchoolPlansMap(nextMap);
      emitUpdate(nextMap);
    },
    [schoolPlansMap, currentSchool.id, currentSchoolPlan, allEmployeesList, emitUpdate]
  );

  // Handle direct contact number change
  const handleUpdateContactNumber = useCallback(
    (phoneVal: string) => {
      const nextPlan: ISchoolInstallationPlan = {
        ...currentSchoolPlan,
        contactNumber: phoneVal,
        trainers: (currentSchoolPlan.trainers || []).map((t, idx) =>
          idx === 0 ? { ...t, phone: phoneVal } : t
        ),
      };

      const nextMap = {
        ...schoolPlansMap,
        [currentSchool.id]: nextPlan,
      };
      setSchoolPlansMap(nextMap);
      emitUpdate(nextMap);
    },
    [schoolPlansMap, currentSchool.id, currentSchoolPlan, emitUpdate]
  );

  // Handle direct date planned for installation change
  const handleUpdatePlanningDate = useCallback(
    (dateVal: string) => {
      const nextPlan: ISchoolInstallationPlan = {
        ...currentSchoolPlan,
        planOutDate: dateVal,
        plannedInstallationDate: dateVal,
        datePlannedForInstallation: dateVal,
      };

      const nextMap = {
        ...schoolPlansMap,
        [currentSchool.id]: nextPlan,
      };
      setSchoolPlansMap(nextMap);
      emitUpdate(nextMap);
    },
    [schoolPlansMap, currentSchool.id, currentSchoolPlan, emitUpdate]
  );

  // Update a top-level field on active school's plan
  const handleUpdateActiveField = useCallback(
    (field: keyof ISchoolInstallationPlan, val: any) => {
      const nextMap = {
        ...schoolPlansMap,
        [currentSchool.id]: {
          ...currentSchoolPlan,
          [field]: val,
        },
      };
      setSchoolPlansMap(nextMap);
      emitUpdate(nextMap);
    },
    [schoolPlansMap, currentSchool.id, currentSchoolPlan, emitUpdate]
  );

  // 4. Employee Assignment Dropdown Change Handler
  const handleSelectEmployeeForTrainer = useCallback(
    (trainerIndex: number, empId: string) => {
      const currentTrainers = [...(currentSchoolPlan.trainers || [])];
      if (!currentTrainers[trainerIndex]) return;

      if (!empId) {
        currentTrainers[trainerIndex] = {
          ...currentTrainers[trainerIndex],
          trainerId: '',
          name: '',
          employeeCode: '',
          phone: '',
          email: '',
        };
      } else {
        const matchedEmp = allEmployeesList.find((e) => e._id === empId);
        if (matchedEmp) {
          const defaultRole =
            trainerIndex === 0
              ? (matchedEmp.designation || (isTrainingContext ? 'Trainer 1 (Lead Trainer)' : 'Trainer 1 (Lead Field Engineer)'))
              : (matchedEmp.designation || `Trainer ${trainerIndex + 1} (Assistant Trainer)`);

          currentTrainers[trainerIndex] = {
            ...currentTrainers[trainerIndex],
            trainerId: matchedEmp._id,
            name: matchedEmp.name,
            employeeCode: matchedEmp.employeeCode || '',
            phone: matchedEmp.phone || currentTrainers[trainerIndex].phone || '',
            email: matchedEmp.email || currentTrainers[trainerIndex].email || '',
            designation: matchedEmp.designation || '',
            role: defaultRole,
          };
        }
      }

      const nextPlan: ISchoolInstallationPlan = {
        ...currentSchoolPlan,
        trainers: currentTrainers,
        technicalPersonId: currentTrainers[0]?.trainerId || '',
        technicalPersonName: currentTrainers[0]?.name || '',
        contactNumber: currentTrainers[0]?.phone || currentSchoolPlan.contactNumber || '',
      };

      const nextMap = {
        ...schoolPlansMap,
        [currentSchool.id]: nextPlan,
      };
      setSchoolPlansMap(nextMap);
      emitUpdate(nextMap);
    },
    [schoolPlansMap, currentSchool.id, currentSchoolPlan, allEmployeesList, isTrainingContext, emitUpdate]
  );

  // Update trainer role or phone or name
  const handleUpdateTrainerField = useCallback(
    (trainerIndex: number, field: keyof ISchoolTrainer, val: any) => {
      const currentTrainers = [...(currentSchoolPlan.trainers || [])];
      if (!currentTrainers[trainerIndex]) return;

      currentTrainers[trainerIndex] = {
        ...currentTrainers[trainerIndex],
        [field]: val,
      };

      const nextPlan: ISchoolInstallationPlan = {
        ...currentSchoolPlan,
        trainers: currentTrainers,
        ...(trainerIndex === 0 && field === 'phone' ? { contactNumber: val } : {}),
        ...(trainerIndex === 0 && field === 'name' ? { technicalPersonName: val } : {}),
      };

      const nextMap = {
        ...schoolPlansMap,
        [currentSchool.id]: nextPlan,
      };
      setSchoolPlansMap(nextMap);
      emitUpdate(nextMap);
    },
    [schoolPlansMap, currentSchool.id, currentSchoolPlan, emitUpdate]
  );

  // 5. Add dynamic trainer (+ Add Trainer button)
  const handleAddTrainer = useCallback(() => {
    const currentTrainers = currentSchoolPlan.trainers || [];
    const trainerNumber = currentTrainers.length + 1;

    // In training context: explicitly empty trainer name and phone number
    // In installation context: pick next unassigned installation employee
    let nextEmp: any = null;
    if (!isTrainingContext) {
      const assignedIds = new Set(currentTrainers.map((t) => t.trainerId).filter(Boolean));
      nextEmp =
        installationEmployees.find((e) => !assignedIds.has(e._id)) ||
        otherEmployees.find((e) => !assignedIds.has(e._id));
    }

    const newTrainer: ISchoolTrainer = {
      id: `trainer_${Date.now()}_${trainerNumber}`,
      trainerId: nextEmp?._id || '',
      name: nextEmp?.name || '',
      employeeCode: nextEmp?.employeeCode || '',
      designation: nextEmp?.designation || '',
      phone: nextEmp?.phone || '',
      email: nextEmp?.email || '',
      role: isTrainingContext ? `Trainer ${trainerNumber}` : `Trainer ${trainerNumber} (Field Engineer)`,
    };

    const nextMap = {
      ...schoolPlansMap,
      [currentSchool.id]: {
        ...currentSchoolPlan,
        trainers: [...currentTrainers, newTrainer],
      },
    };
    setSchoolPlansMap(nextMap);
    emitUpdate(nextMap);
  }, [
    schoolPlansMap,
    currentSchool.id,
    currentSchoolPlan,
    isTrainingContext,
    installationEmployees,
    otherEmployees,
    emitUpdate,
  ]);

  // Remove trainer
  const handleRemoveTrainer = useCallback(
    (trainerIndex: number) => {
      const currentTrainers = (currentSchoolPlan.trainers || []).filter(
        (_, idx) => idx !== trainerIndex
      );

      const nextMap = {
        ...schoolPlansMap,
        [currentSchool.id]: {
          ...currentSchoolPlan,
          trainers: currentTrainers,
        },
      };
      setSchoolPlansMap(nextMap);
      emitUpdate(nextMap);
    },
    [schoolPlansMap, currentSchool.id, currentSchoolPlan, emitUpdate]
  );

  // Copy current school's installation plan to all other schools (Apply to All)
  const handleApplyToAllSchools = useCallback(() => {
    const sourcePlan = currentSchoolPlan;
    const nextMap = { ...schoolPlansMap };

    effectiveSchools.forEach((sch) => {
      if (sch.id !== currentSchool.id) {
        nextMap[sch.id] = {
          schoolId: sch.id,
          schoolName: sch.name,
          address: sch.address || '',
          contactPerson: sch.pocName || sch.contactPerson || '',
          contactPhone: sch.pocContact || '',
          technicalPersonId: sourcePlan.technicalPersonId || '',
          technicalPersonName: sourcePlan.technicalPersonName || '',
          contactNumber: sourcePlan.contactNumber || '',
          planOutDate: sourcePlan.planOutDate || '',
          plannedInstallationDate: sourcePlan.plannedInstallationDate || sourcePlan.planOutDate || '',
          datePlannedForInstallation: sourcePlan.datePlannedForInstallation || sourcePlan.planOutDate || '',
          status: sourcePlan.status || 'SCHEDULED',
          trainers: JSON.parse(JSON.stringify(sourcePlan.trainers || [])),
        };
      }
    });

    setSchoolPlansMap(nextMap);
    emitUpdate(nextMap);
  }, [currentSchoolPlan, effectiveSchools, currentSchool.id, schoolPlansMap, emitUpdate]);

  // Send assignment notification with Date, Time, Location, Role, Trainee
  const handleSendNotification = useCallback(async () => {
    try {
      setNotifying(true);
      setNotifySuccess(null);
      setNotifyError(null);

      const assignedTrainers = (currentSchoolPlan.trainers || []).filter(
        (t) => t.name && t.name.trim() !== ''
      );

      if (assignedTrainers.length === 0) {
        setNotifyError('Please select at least one assigned team member before sending notification.');
        setNotifying(false);
        return;
      }

      const schoolName = currentSchool.name || 'Campus School';
      const location = currentSchool.address || currentSchool.district || 'School Campus Site';
      const date = currentSchoolPlan.planOutDate || 'Scheduled Deployment Date';
      const time = '09:30 AM';

      const recipientIds: string[] = [];
      const trainerSummaries: string[] = [];

      assignedTrainers.forEach((t) => {
        const emp = findEmployee(t.trainerId, t.name);
        if (emp?._id) recipientIds.push(emp._id);
        trainerSummaries.push(t.name);
      });

      const assignedStaff = trainerSummaries.join(', ');
      const message = `Deployment assignment confirmed for ${schoolName}. The on-site installation, testing, and teacher training is scheduled for ${date} at ${time}. Campus Location: ${location}. Assigned personnel: ${assignedStaff}. Please coordinate with institutional authorities and complete all pre-deployment operational checklists.`;

      const title = `Deployment and Training Assignment: ${schoolName}`;

      await notificationsApi.sendNotification({
        recipients: recipientIds.length > 0 ? recipientIds : undefined,
        projectId: project?._id || (project as any)?.id,
        title,
        message,
        type: 'TASK_ASSIGNED',
        metadata: {
          schoolName,
          location,
          date,
          time,
          trainers: trainerSummaries,
          projectId: project?.projectId || project?._id
        }
      });

      setNotifySuccess(
        `Assignment notification has been transmitted successfully for ${schoolName} to: ${trainerSummaries.join(', ')}.`
      );
      setTimeout(() => setNotifySuccess(null), 6000);
    } catch (err: any) {
      console.error('Failed to send assignment notification:', err);
      setNotifyError(err.response?.data?.message || err.message || 'Failed to send notification.');
    } finally {
      setNotifying(false);
    }
  }, [currentSchoolPlan, currentSchool, findEmployee, project]);

  // Total trainers assigned across all schools
  const totalTrainersAcrossSchools = useMemo(() => {
    return Object.values(schoolPlansMap).reduce(
      (acc, plan) => acc + (plan?.trainers?.length || 0),
      0
    );
  }, [schoolPlansMap]);

  return (
    <div className="space-y-4 font-sans">
      {/* ── STEP 1: Institutional School Master-Card Selector (Matching Stage 03 Solutions exactly!) ── */}
      <InstitutionalSchoolSelector
        schools={effectiveSchools}
        activeIndex={activeSchoolIndex}
        onSelectIndex={setActiveSchoolIndex}
        activeItemCount={isTrainingContext ? (currentSchoolPlan.trainers?.length || 1) : (currentSchoolPlan.technicalPersonName ? 1 : 0)}
        itemTypeLabel={isTrainingContext ? "Trainers" : "Tech Person"}
        totalAcrossSchoolsText={isTrainingContext ? `Total Across Schools: ${totalTrainersAcrossSchools} Trainers Assigned` : `Total Schools: ${effectiveSchools.length}`}
        getItemCountForSchool={(schoolId) => isTrainingContext ? (schoolPlansMap[schoolId]?.trainers?.length || 1) : (schoolPlansMap[schoolId]?.technicalPersonName ? 1 : 0)}
        onApplyToAll={handleApplyToAllSchools}
        disabled={disabled}
      />

      {/* ── STEP 2: CONFIGURE INSTALLATION / TRAINING FOR ACTIVE SCHOOL ── */}
      <div
        key={currentSchool.id || `school-installation-${activeSchoolIndex}`}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 animate-in fade-in-50 duration-200"
      >
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-[#3a7d84] text-white flex items-center justify-center font-bold text-xs shrink-0">
              2
            </span>
            <div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 tracking-tight leading-tight">
                {isTrainingContext ? 'CONFIGURE TRAINING ROLLOUT FOR ' : 'INSTALLATION PLANNING FOR '}
                <span className="text-[#3a7d84]">{currentSchool.name}</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isTrainingContext 
                  ? 'Set school training plan out date and assign academic trainers from the company employee roster.' 
                  : 'Assign technical person, contact number and date planned for this school installation.'}
              </p>
            </div>
          </div>
          {!isTrainingContext && effectiveSchools.length > 1 && (
            <button
              type="button"
              onClick={handleApplyToAllSchools}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f0f8f9] hover:bg-[#e0f3f5] text-[#3a7d84] border border-[#b6e0e4] transition shadow-2xs cursor-pointer active:scale-95 self-start sm:self-auto"
              title="Copy this Technical Person, Contact No & Date Planned to all schools"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Apply to All Schools</span>
            </button>
          )}
        </div>

        {/* School Auto-Populated Info Banner (Foreign Key referenced from School Selection) */}
        <div className="p-3 rounded-xl bg-[#f8fafb] border border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-700">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-[#3a7d84] shrink-0" />
            <span className="text-slate-500">Address:</span>
            <strong className="text-slate-900 truncate max-w-xs sm:max-w-md">
              {currentSchool.address || 'Address registered in school database'}
            </strong>
          </div>

          {(currentSchool.pocName || currentSchool.contactPerson) && (
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#3a7d84] shrink-0" />
              <span className="text-slate-500">Site POC:</span>
              <strong className="text-slate-900">
                {currentSchool.pocName || currentSchool.contactPerson}
              </strong>
            </div>
          )}

          {currentSchool.pocContact && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#3a7d84] shrink-0" />
              <span className="text-slate-500">Phone:</span>
              <strong className="text-slate-900">{currentSchool.pocContact}</strong>
            </div>
          )}
        </div>

        {/* ── TECHNICAL PERSON, CONTACT NO & DATE PLANNED FOR INSTALLATION ── */}
        {!isTrainingContext ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Field 1: Technical Person */}
            <div>
              <label className="block text-xs font-bold text-[#3a7d84] mb-1 font-heading flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#51a8b1]" />
                <span>Technical Person</span>
                <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={disabled}
                value={currentSchoolPlan.technicalPersonId || ''}
                onChange={(e) => handleSelectTechnicalPerson(e.target.value)}
                className="w-full text-xs font-semibold py-2 px-3 bg-white border border-slate-300 hover:border-[#51a8b1] rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#51a8b1] cursor-pointer transition shadow-2xs"
              >
                <option value="">Select Technical Person...</option>
                {installationEmployees.length > 0 && (
                  <optgroup label="Installation & Technical Team">
                    {installationEmployees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} {emp.employeeCode ? `[${emp.employeeCode}]` : ''} — {emp.designation || 'Field Engineer'}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="All Staff">
                  {otherEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} {emp.employeeCode ? `[${emp.employeeCode}]` : ''} — {emp.designation || 'Staff'}
                    </option>
                  ))}
                </optgroup>
              </select>
              <span className="text-[10.5px] text-slate-500 mt-1 block">
                Assigned technical person responsible for on-site installation
              </span>
            </div>

            {/* Field 2: Contact No */}
            <div>
              <label className="block text-xs font-bold text-[#3a7d84] mb-1 font-heading flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#51a8b1]" />
                <span>Contact No</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={currentSchoolPlan.contactNumber || ''}
                onChange={(e) => handleUpdateContactNumber(e.target.value)}
                placeholder="e.g. 9811001105"
                disabled={disabled}
                className="w-full text-xs font-medium py-2 px-3 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#51a8b1] focus:border-transparent text-slate-900 shadow-2xs"
              />
              <span className="text-[10.5px] text-slate-500 mt-1 block">
                Direct phone number for technical coordination
              </span>
            </div>

            {/* Field 3: Date Planned for Installation */}
            <div>
              <label className="block text-xs font-bold text-[#3a7d84] mb-1 font-heading flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#51a8b1]" />
                <span>Date Planned for Installation</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={currentSchoolPlan.datePlannedForInstallation || currentSchoolPlan.planOutDate || currentSchoolPlan.plannedInstallationDate || ''}
                onChange={(e) => handleUpdatePlanningDate(e.target.value)}
                disabled={disabled}
                className="w-full text-xs font-medium py-2 px-3 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#51a8b1] focus:border-transparent text-slate-900 shadow-2xs cursor-pointer"
              />
              <span className="text-[10.5px] text-slate-500 mt-1 block">
                Target scheduled date for physical on-site installation
              </span>
            </div>
          </div>
        ) : (
          /* TRAINING CONTEXT (Preserved for Stage 07) */
          <>
            {/* Form Fields: Plan Out Date */}
            <div>
              <label className="block text-xs font-bold text-[#3a7d84] mb-1 font-heading flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#51a8b1]" />
                <span>Training Plan Out Date / Scheduled Training Date</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={currentSchoolPlan.planOutDate || ''}
                onChange={(e) => handleUpdateActiveField('planOutDate', e.target.value)}
                disabled={disabled}
                className="w-full sm:max-w-md text-xs font-medium py-2 px-3 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#51a8b1] focus:border-transparent text-slate-900 shadow-2xs"
              />
              <span className="text-[10.5px] text-slate-500 mt-1 block">
                Target date for academic trainer on-site arrival and workshop conduct
              </span>
            </div>

            {/* Clean Assigned Team & Notification Section */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#3a7d84]" />
                  <label className="text-xs font-bold text-[#3a7d84] uppercase tracking-wider font-heading">
                    Assigned Academic Trainers ({currentSchoolPlan.trainers?.length || 0})
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddTrainer}
                    disabled={disabled}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#f0f8f9] hover:bg-[#e0f3f5] text-[#3a7d84] border border-[#b6e0e4] transition shadow-2xs cursor-pointer active:scale-95"
                    title="Add another team member"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Add Trainer</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendNotification}
                    disabled={disabled || notifying}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#3a7d84] to-[#51a8b1] hover:from-[#2d6b73] hover:to-[#42959e] text-white shadow-xs hover:shadow-md transition cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Send assignment notification to assigned team members"
                  >
                    <Bell className={`w-3.5 h-3.5 ${notifying ? 'animate-bounce' : ''}`} />
                    <span>{notifying ? 'Sending...' : 'Notify Assigned Trainers'}</span>
                  </button>
                </div>
              </div>

              {/* Feedback Banners */}
              {notifySuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{notifySuccess}</span>
                </div>
              )}

              {notifyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-medium">{notifyError}</span>
                </div>
              )}

              {/* Clean, Non-Messy Team List */}
              <div className="space-y-2">
                {(currentSchoolPlan.trainers || []).map((trainer, tIdx) => {
                  const matchedEmp = findEmployee(trainer.trainerId, trainer.name);
                  const selectedEmpId = matchedEmp?._id || trainer.trainerId || '';
                  const rowKey = trainer.id || `trainer_${tIdx}`;
                  const isCustom = Boolean(customTrainerRows[rowKey]);

                  return (
                    <div
                      key={trainer.id || tIdx}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-2.5 rounded-xl bg-[#f8fafb] border border-slate-200 hover:border-[#b6e0e4] transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-2 grow min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-[#3a7d84] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {tIdx + 1}
                        </span>

                        <div className="grow min-w-0">
                          {isCustom ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                disabled={disabled}
                                value={trainer.name || ''}
                                onChange={(e) => handleUpdateTrainerField(tIdx, 'name', e.target.value)}
                                placeholder={isTrainingContext ? 'Enter Trainer Name...' : 'Enter Technician Name...'}
                                className="w-full text-xs font-semibold py-1.5 px-3 bg-white border border-slate-300 hover:border-[#51a8b1] rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#51a8b1] transition"
                              />
                              <button
                                type="button"
                                onClick={() => setCustomTrainerRows((prev) => ({ ...prev, [rowKey]: false }))}
                                className="text-[11px] text-[#3a7d84] hover:underline whitespace-nowrap shrink-0 px-1 font-semibold cursor-pointer"
                                title="Switch to employee list dropdown"
                              >
                                Staff List
                              </button>
                            </div>
                          ) : (
                            <select
                              disabled={disabled}
                              value={selectedEmpId}
                              onChange={(e) => {
                                if (e.target.value === '__CUSTOM__') {
                                  setCustomTrainerRows((prev) => ({ ...prev, [rowKey]: true }));
                                } else {
                                  handleSelectEmployeeForTrainer(tIdx, e.target.value);
                                }
                              }}
                              className="w-full text-xs font-semibold py-1.5 px-3 bg-white border border-slate-300 hover:border-[#51a8b1] rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#51a8b1] cursor-pointer transition truncate"
                            >
                              <option value="">{isTrainingContext ? 'Select Trainer...' : 'Select Employee or Trainee...'}</option>
                              <option value="__CUSTOM__">+ Type Custom Trainer Name...</option>
                              {trainer.name && !matchedEmp && (
                                <option value={trainer.trainerId || trainer.name}>
                                  {trainer.name} (Assigned)
                                </option>
                              )}
                              {installationEmployees.length > 0 && (
                                <optgroup label={isTrainingContext ? 'Training & Field Team' : 'Installation & Field Team'}>
                                  {installationEmployees.map((emp) => (
                                    <option key={emp._id} value={emp._id}>
                                      {emp.name} {emp.employeeCode ? `[${emp.employeeCode}]` : ''} — {emp.designation || (isTrainingContext ? 'Trainer' : 'Field Engineer')}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              <optgroup label="All Staff">
                                {otherEmployees.map((emp) => (
                                  <option key={emp._id} value={emp._id}>
                                    {emp.name} {emp.employeeCode ? `[${emp.employeeCode}]` : ''} — {emp.designation || 'Staff'}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Phone Number Field */}
                      <div className="flex items-center gap-1.5 sm:w-44 shrink-0">
                        <input
                          type="tel"
                          disabled={disabled}
                          value={trainer.phone || ''}
                          onChange={(e) => handleUpdateTrainerField(tIdx, 'phone', e.target.value)}
                          placeholder="Contact No / Phone"
                          className="w-full text-xs font-medium py-1.5 px-2.5 bg-white border border-slate-300 hover:border-[#51a8b1] rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#51a8b1] transition"
                        />
                      </div>

                      {(currentSchoolPlan.trainers || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTrainer(tIdx)}
                          disabled={disabled}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Notification Summary */}
              <div className="p-3 rounded-xl bg-[#f0f8f9] border border-[#b6e0e4]/60 text-xs text-[#2d6b73] flex items-start gap-2.5">
                <Bell className="w-4 h-4 text-[#3a7d84] shrink-0 mt-0.5" />
                <div className="grow space-y-1">
                  <div className="font-bold text-[#1f4e54]">
                    Notification Summary:
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Deployment scheduled for <strong>{currentSchoolPlan.planOutDate || 'Pending Date'}</strong> at <strong>09:30 AM</strong> at <strong>{currentSchool.name}</strong> ({currentSchool.address || 'Campus Location'}). Assigned personnel: <strong>{(currentSchoolPlan.trainers || []).map(t => t.name || 'Unassigned').join(', ')}</strong>.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function TrainingPlanningSection(props: InstallationPlanningSectionProps) {
  return <InstallationPlanningSection {...props} isTrainingContext={true} />;
}

export default InstallationPlanningSection;
