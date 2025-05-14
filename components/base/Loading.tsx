import Swal from 'sweetalert2';

export const showLoadingSwal = (text = 'Sedang diproses...') =>
  Swal.fire({
    title: text,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

export const closeSwal = () => Swal.close();