export const formatDateAR = (value?: string | Date) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-AR");
};

export const formatTimeAR = (value?: string | Date) => {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const shortTime = (value?: string) => value?.substring(0, 5) || "--:--";

export const formatMoneyAR = (value: number | string = 0) => Number(value || 0).toLocaleString("es-AR");

export const todayInputValue = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - offset).toISOString().split("T")[0];
};
