// Import CSS dependencies
import 'bootstrap/dist/css/bootstrap.min.css';
import 'jquery-ui/themes/base/all.css';
import 'leaflet/dist/leaflet.css';
import 'font-awesome/css/font-awesome.min.css';
import 'sweetalert2/dist/sweetalert2.min.css';

// Import JS dependencies
import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.min.js';
import 'jquery-ui/ui/core.js';
import 'jquery-ui/ui/widget.js';
import 'jquery-ui/ui/widgets/selectmenu.js';
import L from 'leaflet';
import Swal from 'sweetalert2';

// Make jQuery available globally (for existing code compatibility)
window.$ = window.jQuery = $;
window.L = L;
window.Swal = Swal;

// Import your existing map module
import './js/map.js';