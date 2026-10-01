import { useState, useCallback } from 'react';
import { Patient } from '../types/patient';
import { AppointmentItem } from '../components/schedule/AppointmentModal';
import { InventoryItem } from '../components/inventory/InventoryModal';
import { LabOrder } from '../components/prosthetics/LabOrderModal';
import { CheckoutResult } from '../components/financial/CheckoutModal';

export function useModals() {
  // Estados de visibilidade dos modais
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isAnamnesisModalOpen, setIsAnamnesisModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isLabOrderModalOpen, setIsLabOrderModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isReceptionistSwitchModalOpen, setIsReceptionistSwitchModalOpen] = useState(false);
  const [isActivePatientSwitchModalOpen, setIsActivePatientSwitchModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Estados de dados temporários vinculados aos modais
  const [checkoutData, setCheckoutData] = useState<CheckoutResult | null>(null);
  const [selectedAppointmentForCheckout, setSelectedAppointmentForCheckout] = useState<AppointmentItem | null>(null);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [appointmentToEdit, setAppointmentToEdit] = useState<AppointmentItem | null>(null);
  const [selectedPatientForAppointment, setSelectedPatientForAppointment] = useState<string | undefined>(undefined);
  const [inventoryItemToEdit, setInventoryItemToEdit] = useState<InventoryItem | null>(null);
  const [labOrderToEdit, setLabOrderToEdit] = useState<LabOrder | null>(null);

  // Handlers utilitários
  const openNewPatientModal = useCallback(() => {
    setPatientToEdit(null);
    setIsPatientModalOpen(true);
  }, []);

  const openEditPatientModal = useCallback((patient: Patient) => {
    setPatientToEdit(patient);
    setIsPatientModalOpen(true);
  }, []);

  const closePatientModal = useCallback(() => {
    setIsPatientModalOpen(false);
    setPatientToEdit(null);
  }, []);

  const openNewAppointmentModal = useCallback((patientName?: string) => {
    setAppointmentToEdit(null);
    setSelectedPatientForAppointment(patientName);
    setIsAppointmentModalOpen(true);
  }, []);

  const openEditAppointmentModal = useCallback((app: AppointmentItem) => {
    setAppointmentToEdit(app);
    setIsAppointmentModalOpen(true);
  }, []);

  const closeAppointmentModal = useCallback(() => {
    setIsAppointmentModalOpen(false);
    setAppointmentToEdit(null);
    setSelectedPatientForAppointment(undefined);
  }, []);

  const openNewInventoryModal = useCallback(() => {
    setInventoryItemToEdit(null);
    setIsInventoryModalOpen(true);
  }, []);

  const openEditInventoryModal = useCallback((item: InventoryItem) => {
    setInventoryItemToEdit(item);
    setIsInventoryModalOpen(true);
  }, []);

  const closeInventoryModal = useCallback(() => {
    setIsInventoryModalOpen(false);
    setInventoryItemToEdit(null);
  }, []);

  const openNewLabOrderModal = useCallback(() => {
    setLabOrderToEdit(null);
    setIsLabOrderModalOpen(true);
  }, []);

  const openEditLabOrderModal = useCallback((order: LabOrder) => {
    setLabOrderToEdit(order);
    setIsLabOrderModalOpen(true);
  }, []);

  const closeLabOrderModal = useCallback(() => {
    setIsLabOrderModalOpen(false);
    setLabOrderToEdit(null);
  }, []);

  return {
    // Visibilidade
    isConsentModalOpen,
    setIsConsentModalOpen,
    isAnamnesisModalOpen,
    setIsAnamnesisModalOpen,
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    isReceiptModalOpen,
    setIsReceiptModalOpen,
    isPatientModalOpen,
    setIsPatientModalOpen,
    isAppointmentModalOpen,
    setIsAppointmentModalOpen,
    isInventoryModalOpen,
    setIsInventoryModalOpen,
    isLabOrderModalOpen,
    setIsLabOrderModalOpen,
    isPrescriptionModalOpen,
    setIsPrescriptionModalOpen,
    isPinModalOpen,
    setIsPinModalOpen,
    isDocumentModalOpen,
    setIsDocumentModalOpen,
    isReceptionistSwitchModalOpen,
    setIsReceptionistSwitchModalOpen,
    isActivePatientSwitchModalOpen,
    setIsActivePatientSwitchModalOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,

    // Dados vinculados
    checkoutData,
    setCheckoutData,
    selectedAppointmentForCheckout,
    setSelectedAppointmentForCheckout,
    patientToEdit,
    setPatientToEdit,
    appointmentToEdit,
    setAppointmentToEdit,
    selectedPatientForAppointment,
    setSelectedPatientForAppointment,
    inventoryItemToEdit,
    setInventoryItemToEdit,
    labOrderToEdit,
    setLabOrderToEdit,

    // Ações de conveniência
    openNewPatientModal,
    openEditPatientModal,
    closePatientModal,
    openNewAppointmentModal,
    openEditAppointmentModal,
    closeAppointmentModal,
    openNewInventoryModal,
    openEditInventoryModal,
    closeInventoryModal,
    openNewLabOrderModal,
    openEditLabOrderModal,
    closeLabOrderModal
  };
}
