<?php

$SQL = "SELECT t.tagref, 
				t.tagdescription
		FROM sec_unegsxuser u,tags t 
		WHERE u.tagref = t.tagref 
			AND u.userid = '" . $_SESSION['UserID'] . "'
		GROUP BY t.tagref, t.tagdescription ORDER BY t.tagdescription";

$result = DB_query($SQL, $db);
$optionUnidadNegocio = "";
while ($myrow = DB_fetch_array($result)) {
	$optionUnidadNegocio .= '<option value=' . $myrow['tagref'] . '>' . $myrow['tagdescription'] . '</option>';
}

/** REVISAMOS SI HAY COTIZACIONES POR AUTORIZAR*/
/* 
$sql="SELECT * FROM notificaciones_erp WHERE CURDATE()  <= fecha_vencimiento  AND estatus = 1;";
$rsNotificacion=DB_query($sql,$db);
$numNotificacion = DB_num_rows($rsNotificacion);
$sql="SELECT * FROM notificaciones_erp WHERE CURDATE()  <= fecha_vencimiento;";
$rsNotificacion=DB_query($sql,$db);
$rowNotificacion= mysqli_fetch_object($rsNotificacion);

$disableAutorizarOV = "hide";
if($permisoAutorizarOV == 1){
	$disableAutorizarOV = "";
}
*/

?>

<!--
<link rel="stylesheet" href="javascripts/multiselect/bootstrap-multiselect.css" type="text/css">


<link href="lib/bootstrap/css/3.3.6/bootstrap.min.css" rel="stylesheet">
<script src="lib/bootstrap/js/3.3.6/bootstrap.min.js" type="text/javascript"></script>


 
<link href="wizard/css/bootstrap.min.css" rel="stylesheet" />

<link href="wizard/css/paper-bootstrap-wizard.css" rel="stylesheet" />
-->
<!-- CSS Just for demo purpose, don't include it in your project -->
<link href="wizard/css/demo.css" rel="stylesheet" />

<!-- Fonts and Icons -->
<link href="https://netdna.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.css" rel="stylesheet">
<link href='https://fonts.googleapis.com/css?family=Muli:400,300' rel='stylesheet' type='text/css'>
<link href="wizard/css/themify-icons.css" rel="stylesheet">
<script src="Angular1/sweetalert-master/dist/sweetalert.min.js"></script>
<link rel="stylesheet" type="text/css" href="Angular1/sweetalert-master/dist/sweetalert.css">

<style>
	/* ── Botón flotante ─────────────────────────────────────────────── */
	.btn-flotante {
		font-size: 16px;
		/* Cambiar el tamaño de la tipografia */
		text-transform: uppercase;
		/* Texto en mayusculas */
		font-weight: bold;
		/* Fuente en negrita o bold */
		color: #ffffff;
		/* Color del texto */
		border-radius: 5px;
		/* Borde del boton */
		letter-spacing: 2px;
		/* Espacio entre letras */
		/*background-color: #E91E63; /* Color de fondo */
		padding: 16px 20px;
		/* Relleno del boton */
		border-color: lightsteelblue;
		position: fixed;
		top: 131px;
		right: -12px;
		height: 20px;
		transition: all 300ms ease 0ms;
		box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);
		z-index: 99;
	}
	.btn-flotante:hover {
		background-color: #2c2fa5;
		/* Color de fondo al pasar el cursor */
		box-shadow: 0px 15px 20px rgba(0, 0, 0, 0.3);
		transform: translateY(-7px);
	}

	/* ── Campos numéricos ───────────────────────────────────────────── */
	.clsCantidadProducto,
	.clsTotalProducto,
	.clsPrecioCNew,
	.clsCantidadProductoC,
	.clsSubTotalProductoC {
		width: 100px;
	}

	/* ── Contenedores auxiliares ────────────────────────────────────── */
	.mdlContenedorNotificaciones {
		width: 50%;
		right: 0px;
		bottom: 0px;
		position: absolute;
	}

	#myModal.modal.fade {
		opacity: 1;
	}

	#myModal.modal.fade .modal-dialog {
		-webkit-transform: translate(0);
		-moz-transform: translate(0);
		transform: translate(0);
	}

	.pestanaMapa.tab-content {
		display: none;
	}
	.pestanaMapa.tab-content.active {
		display: block;
	}
	.contactado.btn-selected {
		background-color: #3DAE20 !important;
		color: white !important;
	}

	/*
	@media only screen and (max-width: 600px) {
		.btn-flotante {
			font-size: 14px;
			padding: 12px 20px;
			bottom: 20px;
			right: 20px;
		}
			.mdlContenedorNotificaciones{
				width:90%;
			}
		}*/

	/* ── Wizard: base del plugin ────────────────────────────────────── */
	#modalProspecto .nav-pills > li > a {
		background: transparent !important;
		border: none !important;
	}

	#modalProspecto .nav-pills > li > a:after {
		display: none !important;
	}

	#modalProspecto .wizard-card[data-color="orange"] .nav-pills > li.active > a,
	#modalProspecto .wizard-card[data-color="orange"] .nav-pills > li.active > a:focus,
	#modalProspecto .wizard-card[data-color="orange"] .nav-pills > li.active > a:hover {
		background: transparent !important;
	}

	/* ── Wizard: círculos de pasos ──────────────────────────────────── */
	#modalProspecto .icon-circle {
		display: inline-flex !important;
		align-items: center !important;
		justify-content: center !important;
		width: 44px !important;
		height: 44px !important;
		border-radius: 50% !important;
		background-color: #f1f5f9 !important;
		border: 2px solid #cbd5e1 !important;
		color: #94a3b8 !important;
		transition: all 0.3s ease !important;
	}

	#modalProspecto .liEtapas.active .icon-circle {
		background-color: #ffffff !important;
		border: 3px solid #2c7be5 !important;
		color: #2c7be5 !important;
		box-shadow: 0 0 0 5px rgba(44,123,229,0.15) !important;
		transform: scale(1.1) !important;
	}

	#modalProspecto .icon-circle.checked {
		background: linear-gradient(135deg, #2c7be5, #38bdf8) !important;
		border-color: #2c7be5 !important;
		color: #ffffff !important;
		box-shadow: 0 2px 8px rgba(44,123,229,0.35) !important;
	}

	#modalProspecto .icon-circle {
		position: relative !important;
		z-index: 3 !important;
	}

	/* ── Wizard: texto y layout ─────────────────────────────────────── */
	#modalProspecto .liEtapas > a,
	#modalProspecto .wizard-card .nav-pills > li > a {
		color: #94a3b8 !important;
		font-size: 12px !important;
		font-weight: 500 !important;
		text-transform: none !important;
	}

	#modalProspecto .liEtapas.active > a,
	#modalProspecto .wizard-card .nav-pills > li.active > a {
		color: #2c7be5 !important;
		font-weight: 600 !important;
	}

	#modalProspecto .liEtapas > a:hover,
	#modalProspecto .wizard-card .nav-pills > li > a:hover {
		color: #1e6fd1 !important;
		background: transparent !important;
	}

	#modalProspecto .wizard-card .wizard-navigation {
		position: relative !important;
		padding: 30px 40px 14px !important;
	}

	#modalProspecto .wizard-card .wizard-navigation ul {
		display: flex !important;
		justify-content: space-between !important;
		align-items: flex-start !important;
		padding: 0 !important;
		margin: 0 !important;
		list-style: none !important;
		position: relative !important;
		z-index: 2 !important;
	}

	#modalProspecto .wizard-card .wizard-navigation ul li.liEtapas {
		flex: 1 !important;
		text-align: center !important;
		min-width: 0 !important;
	}

	/* ── Modal: formularios, tabs, botones y tablas ────────────────── */
	#modalProspecto input,
	#modalProspecto select,
	#modalProspecto textarea {
		border: 1px solid #ddd;
		border-radius: 6px;
		padding: 8px 12px;
		transition: border-color 0.2s, box-shadow 0.2s;
		font-size: 14px;
	}

	#modalProspecto input:focus,
	#modalProspecto select:focus,
	#modalProspecto textarea:focus {
		border-color: #3b82f6;
		outline: none;
		box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
	}

	#modalProspecto .nav-tabs {
		border: none;
		background: #f1f5f9;
		border-radius: 8px;
		padding: 4px;
		display: inline-flex;
	}

	#modalProspecto .nav-tabs > li > a {
		border: none;
		border-radius: 6px;
		padding: 6px 16px;
		color: #64748b;
		font-size: 13px;
	}

	#modalProspecto .nav-tabs > li.active > a {
		background: #fff;
		color: #1e293b;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
	}

	#modalProspecto .btn {
		border-radius: 6px;
		padding: 8px 20px;
		font-size: 13px;
		font-weight: 500;
		transition: all 0.2s;
	}

	#modalProspecto .btn-cerrar-modal {
		all: unset;
		position: absolute;
		top: 8px;
		right: 8px;
		width: 32px;
		height: 32px;
		background: linear-gradient(180deg, #f28b82 0%, #e53935 100%);
		border: 1px solid #b71c1c;
		border-radius: 4px;
		color: #fff;
		font-size: 18px;
		font-weight: bold;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.3);
		transition: background 0.15s;
	}

	#modalProspecto .btn-cerrar-modal:hover {
		background: linear-gradient(180deg, #ef5350 0%, #c62828 100%);
	}

	#modalProspecto .btn-cerrar-modal:active {
		background: linear-gradient(180deg, #c62828 0%, #b71c1c 100%);
		box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
	}

	#modalProspecto table thead th {
		background: #f8fafc;
		font-weight: 600;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #64748b;
		padding: 10px 12px;
	}

	#modalProspecto table tbody tr:nth-child(even) {
		background: #fafafa;
	}

	#modalProspecto table tbody tr:hover {
		background: #f1f5f9;
	}

	#modalProspecto table td {
		padding: 8px 12px;
		font-size: 13px;
		border-bottom: 1px solid #f1f1f1;
	}

	/* ── Etapa A: imágenes ──────────────────────────────────────────── */
	#modalProspecto .etapa-a-imagenes-panel {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 16px 18px;
	}

	#modalProspecto .etapa-a-imagenes-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		margin-bottom: 12px;
	}

	#modalProspecto .etapa-a-imagenes-title {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		color: #1e293b;
	}

	#modalProspecto .etapa-a-imagenes-note {
		display: block;
		margin-top: 4px;
		font-size: 12px;
		color: #64748b;
	}

	#modalProspecto .etapa-a-imagenes-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	#modalProspecto #etapaA_info {
		margin-bottom: 14px;
		font-size: 12px;
		color: #64748b;
	}

	#modalProspecto .etapa-a-preview-grid {
		margin-left: -8px;
		margin-right: -8px;
	}

	#modalProspecto .etapa-a-preview-item {
		padding-left: 8px;
		padding-right: 8px;
		margin-bottom: 16px;
	}

	#modalProspecto .etapa-a-preview-card {
		height: 100%;
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		box-shadow: 0 10px 25px -20px rgba(15,23,42,0.55);
		overflow: hidden;
	}

	#modalProspecto .etapa-a-preview-card.is-pending {
		border-color: #bfdbfe;
	}

	#modalProspecto .etapa-a-preview-card.is-saved {
		border-color: #cbd5e1;
	}

	#modalProspecto .etapa-a-preview-thumb {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 150px;
		background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
		overflow: hidden;
	}

	#modalProspecto .etapa-a-preview-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	#modalProspecto .etapa-a-preview-body {
		padding: 12px;
	}

	#modalProspecto .etapa-a-preview-name {
		display: block;
		font-size: 12px;
		font-weight: 600;
		color: #1e293b;
		word-break: break-word;
		margin-bottom: 6px;
	}

	#modalProspecto .etapa-a-preview-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		font-size: 11px;
		color: #64748b;
		margin-bottom: 10px;
	}

	#modalProspecto .etapa-a-preview-status {
		display: inline-flex;
		align-items: center;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.4px;
	}

	#modalProspecto .etapa-a-preview-status.pending {
		background: #dbeafe;
		color: #1d4ed8;
	}

	#modalProspecto .etapa-a-preview-status.saved {
		background: #dcfce7;
		color: #166534;
	}

	#modalProspecto .etapa-a-preview-link {
		display: inline-block;
		font-size: 11px;
		font-weight: 600;
		color: #2563eb;
		text-decoration: none;
	}

	#modalProspecto .etapa-a-preview-link:hover {
		text-decoration: underline;
	}

	#modalProspecto .btn-etapa-a-remove {
		padding: 6px 10px;
		font-size: 11px;
	}

	#modalProspecto .etapa-a-preview-empty {
		padding: 20px;
		border: 1px dashed #cbd5e1;
		border-radius: 10px;
		background: #ffffff;
		text-align: center;
		font-size: 12px;
		color: #94a3b8;
	}

	/* ── Modal: espaciado y footer ──────────────────────────────────── */
	#modalProspecto .wizard-pane-body {
		margin-bottom: 20px;
	}

	#modalProspecto .wizard-section {
		margin-bottom: 18px;
	}

	#modalProspecto .wizard-footer {
		position: sticky;
		bottom: 0;
		padding: 16px 24px;
		border-top: 1px solid #e5e7eb;
		background: #fafafa;
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}

	/* ── Responsive ─────────────────────────────────────────────────── */
	@media (max-width: 767px) {
		#modalProspecto .wizard-card .wizard-navigation {
			padding: 20px 10px 10px !important;
		}

		#modalProspecto .wizard-card .wizard-navigation ul {
			display: flex !important;
			flex-wrap: nowrap !important;
			gap: 0 !important;
			align-items: flex-start !important;
		}

		#modalProspecto .wizard-card .wizard-navigation ul li.liEtapas {
			flex: 1 !important;
			min-width: 0 !important;
		}

		#modalProspecto .icon-circle {
			width: 36px !important;
			height: 36px !important;
			font-size: 13px !important;
		}

		#modalProspecto .liEtapas > a,
		#modalProspecto .wizard-card .nav-pills > li > a {
			font-size: 10px !important;
			line-height: 1.25 !important;
			word-break: break-word !important;
		}

		#modalProspecto .etapa-a-imagenes-panel {
			padding: 14px;
		}

		#modalProspecto .etapa-a-preview-thumb {
			height: 120px;
		}

	}

#div_234fasdf2rg #cmbCategoriaArchivo_234fasdf2rg {
    display: block;
    width: 100%;
    max-width: 280px;
    height: 38px;
    padding: 6px 10px;
    font-size: 14px;
    line-height: normal !important;
    color: #333;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    appearance: auto;
    -webkit-appearance: menulist;
    -moz-appearance: menulist;
}

#div_234fasdf2rg #cmbCategoriaArchivo_234fasdf2rg:focus {
    border-color: #66afe9;
    outline: 0;
}

</style>

<!--<button data-toggle="modal" data-target="#mdlNotificaciones" type="button" class="btn btn-flotante" name="btnNotificacionesGeneral" id="btnNotificacionesGeneral" 
	style="right: -23px;
			width: 20px;
			text-align: left;
			margin-left: -20px;
			border-color: lightslategray;">

	<span class="badge" id="lblTotalNewNotificaciones" style="margin-left:-18px; font-size:8px;">0</span>
	<br>
	<span class="glyphicon glyphicon-bell" style="margin-left:-18px" aria-hidden="true"></span>
</button>-->

<!-- Modal -->
<div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" style="z-index: 1350;">
	<div class="modal-dialog modal-lg" role="document" style="width:90%">
		<div class="modal-content" id="modalProspecto" style="border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); background: #fdfdfd;">
			<button type="button" class="close btn-cerrar-modal" data-dismiss="modal" aria-label="Close">✕</button>
	    <div class="modal-body" style="
	        max-height: 85vh;
	        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;">

				<div class="row">
					<div class="col-md-12">
						<!--      Wizard container        -->
						<div class="wizard-container" style="flex:1; padding:15px;">
							<div class="card wizard-card" data-color="orange" id="wizardProfile">
								<form id="formProspecto" name="formProspecto" enctype="multipart/form-data">
									<input type="hidden" value="" name="u_movimientoID" id="u_movimientoID">
									<input type="hidden" value="" name="idOportunidad" id="idOportunidad">
									<input type="hidden" value="" name="idProspecto" id="idProspecto">
									<input type="hidden" value="" name="idContacto" id="idContacto">
										<input type="hidden" value="<?= $permisoAutorizarOV ?>" id="idBotonAut">

											<div class="wizard-navigation">
											<ul>
											<li id="liEtapaA" class="liEtapas" style="text-align: center;">
												<a href="#etapaa" data-toggle="tab" style="color:#8c8c8c;">
													<div id="divEtapaA" class="icon-circle">
														A
													</div>
													Prospecto
												</a>
											</li>
											<li id="liEtapaB" class="liEtapas" style="text-align: center;">
												<a href="#etapab" data-toggle="tab">
													<div id="divEtapaB" class="icon-circle">
														<i class="">B</i>
													</div>
													Visita Sitio
												</a>
											</li>
											<li id="liEtapaC" class="liEtapas" style="text-align: center;">
												<a href="#etapac" data-toggle="tab">
													<div id="divEtapaC" class="icon-circle">
														<i class="">C</i>
													</div>
													Información Visita
												</a>
											</li>
											<li id="liEtapaD" class="liEtapas" style="text-align: center;">
												<a href="#etapad" data-toggle="tab" id="asdfq34tsdfgq4tgwrtb">
													<div id="divEtapaD" class="icon-circle">
														<i class="">D</i>
													</div>
													Contización Entregada
												</a>
											</li>
											<li id="liEtapaE" class="liEtapas hide">
												<a href="#etapae" data-toggle="tab">
													<div id="divEtapaE" class="icon-circle">
														<i class="">E</i>
													</div>
													Programa de Trabajo
												</a>
											</li>
											<li id="liEtapaF" class="liEtapas hide">
												<a href="#etapaf" data-toggle="tab">
													<div id="divEtapaF" class="icon-circle">
														<i class="">F</i>
													</div>
													No sera Cliente
												</a>
											</li>
										</ul>

									</div>
										<div class="tab-content">
											<div class="tab-pane" id="etapaa">
												<div style="overflow-y:auto; flex:1; height:calc(85vh - 180px);">
												<div class="wizard-pane-body">
													<div class="row">
													<div class="col-md-4 col-xs-12">
														<div class="form-group">
															<label><span style='color:red'>*</span> Nombre Prospecto: </label>
															<span id="spProspectoExistente" class="pull-right" style="font-style: italic;color: lightslategray;"># Prospecto: <label id="lblProspectoId_Existente" name="lblProspectoId_Existente">0</label></span>
															<input type="text" size="40" name="aPaterno" id="aPaterno" value="" class="form-control input-sm" required>
														</div>
													</div>
													<div class="col-md-2 col-xs-12">
														<div class="form-group">
															<label>Nombre Alterno:</label>
															<input type="text" size="40" name="aPaterno_alterno" id="aPaterno_alterno" value="" class="form-control input-sm">
														</div>
													</div>
													<div class="col-md-3 col-xs-12">
														<div class="form-group">
															<label><span style='color:red'>*</span> Sector Comercial: </label>
															<select id="SectComClId" class="form-control" name="SectComClId">
																<?php echo $optionSectorComercial; ?>
															</select>
														</div>
													</div>
													<div class="col-md-3 col-xs-12">
														<div class="form-group">
															<label>Email: </label>
															<input type="text" size="40" id="email_pros" name="email" value="" class="form-control input-sm">
														</div>
													</div>
												</div>
												<div class="row">
													<div class="col-md-2 col-xs-12">
														<div class="form-group">
															<label>Teléfono: </label>
															<input class="form-control input-sm" type="text" maxlength="10" size="40" id="telefonoFijo_pros" name="telefonoFijo" value="" placeholder="10 Digitos sin espacios">
														</div>
													</div>
													<div class="col-md-2 col-xs-12">
														<div class="form-group">
															<label>Código Postal: </label>
															<input type="text" size="40" id="cp_pros" name="cp" value="<?= $cp ?>" class="form-control input-sm">
														</div>
													</div>
													<div class="col-md-2 col-xs-12">
														<div class="form-group">
															<label><span style='color:red'>*</span> Estado: </label>
															<select id="estado_pros" class="form-control" name="estado">
																<?php echo $optionEstados; ?>
															</select>
														</div>
													</div>
													<div class="col-md-2 col-xs-12">
														<div class="form-group">
															<label>Municipio: </label>
															<input type="text" id="ciudad_pros" name="ciudad" maxlength="40" value="<?= $ciudad ?>" class="form-control input-sm">
														</div>
													</div>
													<div class="col-md-4 col-xs-12">
														<div class="form-group">
															<label>Colonia: </label>
															<input type="text" id="colonia_pros" name="colonia" maxlength="40" value="<?= $colonia ?>" class="form-control input-sm">
														</div>
													</div>

												</div>
												<div class="row">
													<div class="col-md-4 col-xs-12">
														<div class="form-group">
															<label>Dirección: </label>
															<input type="text" id="direccion_pros" name="direccion" maxlength="140" value="<?= $direccion ?>" class="form-control input-sm">
														</div>
													</div>
													<div class="col-md-2 col-xs-12">
														<div class="form-group">
															<label>Vendedor: </label>
															<?php echo InsertaElemento("comisionistas", "cmbVendedor", "", "", true, "id='cmbVendedor' ", "form-control", false); ?>

														</div>
													</div>
													<div class="col-md-2 col-xs-12">
														<div class="form-group">
															<label><span style='color:red'>*</span>Fuente de Contacto: </label>
															<select id="CustLeadSourceId" class="form-control" name="CustLeadSourceId">
																<?php echo $optionFuenteContacto; ?>
															</select>
														</div>
													</div>
													<div class="col-md-4 col-xs-12">
														<div class="form-group">
															<label>Coordenada Mapa Google: </label>
															<input type="text" class="form-control input-sm" id="txtLinkMapa_pros" name="txtLinkMapa_pros" placeholder="Coordenadas Mapa Google">
														</div>
													</div>
												</div>

												<div class="row">
													<div class="col-md-4 col-xs-12">
														<div class="form-group">
															<label>Coagente: </label>
															<?php echo InsertaElemento("comisionistasMultiselect", "cmbVendedorMulti[]", "", "", true, "id='cmbVendedorMulti' ", "form-control", false); ?>
														</div>
													</div>
													<div class="col-md-8 col-xs-12">
														<div class="form-group">
															<label>Comentarios: </label>
															<input type="text" class="form-control input-sm" id="txtComentarios" name="txtComentarios" placeholder="Comentarios">
														</div>
													</div>
												</div>

												<div class="row wizard-section" id="etapaA_imagenes_container">
													<div class="col-md-12">
														<div class="etapa-a-imagenes-panel">
															<div class="etapa-a-imagenes-header">
																<div>
																	<h4 class="etapa-a-imagenes-title">Imágenes del Prospecto</h4>
																	<span class="etapa-a-imagenes-note">Puedes seleccionar varias imágenes. Se comprimen automáticamente al guardar la Etapa A.</span>
																</div>
																<div class="etapa-a-imagenes-actions">
																	<input type="file" id="etapaA_archivos" multiple accept="image/*" style="display:none;">
																	<button type="button" id="etapaA_seleccionar" class="btn btn-default btn-sm">
																		<span class="glyphicon glyphicon-picture" aria-hidden="true"></span>
																		Seleccionar Imágenes
																	</button>
																	<button type="button" id="etapaA_limpiar" class="btn btn-default btn-sm hide">
																		Limpiar Selección
																	</button>
																</div>
															</div>
															<div id="etapaA_info">Selecciona imágenes JPG o PNG para agregarlas al prospecto.</div>
															<div id="etapaA_preview" class="row etapa-a-preview-grid"></div>
														</div>
													</div>
												</div>

												<div class="row hide">
													<div class="col-md-12">
														<span style="color:red;font-weight:bold">Los datos de contacto solo se dan de alta en este apartado.</span>
													</div>
													<input type="hidden" id="txtIdContacto" value="" />
													<div class="col-md-3 col-xs-12">
														<div class="form-group">
															<label>Nombre del Contacto: </label>
															<input type="text" id="conName" name="conName" maxlength="40" value="" class="form-control input-sm">
														</div>
													</div>
													<div class="col-md-3 col-xs-12">
														<div class="form-group">
															<label>Puesto: </label>
															<input type="text" id="conRole" name="conRole" size="35" maxlength="40" value="" class="form-control input-sm">
														</div>
													</div>
												</div>
												<div class="row hide">
													<div class="col-md-3 col-xs-12">
														<div class="form-group">
															<label>Teléfono Fijo: </label>
															<input class="form-control input-sm" type="Text" onkeyup="phonenumber(this,'fijo')" value="" id="telefonofijo_conta" name="telefonofijo" maxlength="10" value="" size="20" placeholder="10 Digitos sin espacios">
														</div>
													</div>
													<div class="col-md-3 col-xs-12">
														<div class="form-group">
															<label>Teléfono Móvil: </label>
															<input class="form-control input-sm" type="Text" onkeyup="phonenumber(this,'movil')" value="" id="telefonocel_conta" name="telefonocel" maxlength="10" value="" size="20" placeholder="10 Digitos sin espacios">
														</div>
													</div>
													<div class="col-md-3 col-xs-12">
														<div class="form-group">
															<label>Email del Contacto: </label>
															<input type="text" id="emailC_contac" name="emailC" maxlength="40" value="" class="form-control input-sm">
														</div>
													</div>
												</div>
											</div>
												</div>
												<div class="wizard-footer">
													<input id="btnSiguienteEtapaA" type='button' class='btn btn-fill btn-warning btn-wd btn-sm' value='Guardar' data-loading-text="Procesando..." />
													<!-- <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">Cerrar</button> -->
												</div>
											</div>
											<div class="tab-pane" id="etapab">
												<div style="overflow-y:auto; flex:1; height:calc(85vh - 180px);">
												<div class="row wizard-section">
												<div class="col-md-12">
													<div>
														<!-- Nav tabs -->
														<ul class="nav nav-tabs" role="tablist">
															<li role="presentation" class="active"><a href="#b_informacion" aria-controls="b_informacion" role="tab" data-toggle="tab">Información</a></li>
															<li id="liBuscarProductos" role="presentation"><a href="#b_productos" aria-controls="b_productos" role="tab" data-toggle="tab">Productos</a></li>
															<li id="liBuscarCheckTiempoVida" role="presentation"><a href="#b_tiempovida" aria-controls="b_tiempovida" role="tab" data-toggle="tab">Tiempo de Vida</a></li>
														</ul>

														<!-- Tab panes -->
															<div class="tab-content">
																<div role="tabpanel" class="tab-pane active" id="b_informacion">
																	<div class="row hide">
																	<div class="col-md-3 col-xs-12">
																		<div class="form-group">
																			<label><span style='color:red'>*</span>Medio de Contacto: </label>
																			<select id="contactsmensid" class="form-control" name="contactsmensid">
																				<?php echo $optionMedioContacto; ?>
																			</select>
																		</div>
																	</div>
																</div>
																<div class="row">
																	<div class="col-md-3 col-xs-12">
																		<div class="form-group">
																			<label>Encargado Proyecto: </label>
																			<input type="text" class="form-control input-sm" id="txtNombreEncargado" name="txtNombreEncargado" placeholder="Nombre del Encargado">
																		</div>
																	</div>
																	<div class="col-md-3 col-xs-12">
																		<div class="form-group">
																			<label>Teléfono Encargado: </label>
																			<input type="text" class="form-control input-sm" id="txtTelefonoEncargado" name="txtTelefonoEncargado" placeholder="Teléfono del Encargado">
																		</div>
																	</div>
																	<div class="col-md-3 col-xs-12">
																		<div class="form-group">
																			<label>Correo Encargado: </label>
																			<input type="text" class="form-control input-sm" id="txtCorreoEncargado" name="txtCorreoEncargado" placeholder="Correo del Encargado">
																		</div>
																	</div>
																	<div class="col-md-3 col-xs-12">
																		<div class="form-group">
																			<label>KM planta / lugar: </label>
																			<input type="text" class="form-control input-sm" id="txtKmPlanta" name="txtKmPlanta" placeholder="KM planta / lugar">
																		</div>
																	</div>
																	<!--<div class="col-md-3 col-xs-12">
																		<div class="form-group">
																			<label>Área Total: </label>
																			<input type="text" class="form-control input-sm" id="txtAreaTotal" name="txtAreaTotal" placeholder="Área Total">
																		</div>
																	</div>-->
																	<div class="col-md-3 col-xs-12">
																		<div class="form-group">
																			<label>Tiempo dedicado cliente: </label>
																			<input type="number" class="form-control input-sm" id="txtTiempoDedicado" name="txtTiempoDedicado" placeholder="Tiempo dedicado al cliente">
																		</div>
																	</div>
																	<div class="col-md-9 col-xs-12">
																		<div class="form-group">
																			<label>Descripción: </label>
																			<input type="text" class="form-control input-sm" id="txtNecesidadesCliente" name="txtNecesidadesCliente" placeholder="Descripcion">
																		</div>
																	</div>

																	</div>
																	</div>
																<div role="tabpanel" class="tab-pane" id="b_productos">
																	<div class="row wizard-section">
																	<div class="col-md-4 col-xs-12">
																		<div class="form-inline">
																			<label>Área Total: </label>
																			<input type="text" class="form-control input-sm valid text-right" id="txtAreaTotal" name="txtAreaTotal" placeholder="Área Total" style="background-color: cornsilk;width: 20%;font-size: 11pt;">
																		</div>
																	</div>
																	<div class="col-md-8 col-xs-12 text-right">
																		<button class="btn btn-default mdlSelProductoB" data-tipo="Bacheo" style="padding: 4px 18px;" type="button">Bacheo</button>
																		<button class="btn btn-default mdlSelProductoB" data-tipo="Fresado" style="padding: 4px 18px;" type="button">Fresado</button>
																		<button class="btn btn-primary mdlSelProductoB" data-tipo="" style="padding: 4px 18px;" type="button">Buscar Conceptos</button>
																	</div>
																	<div class="col-md-4 col-xs-12 hide">
																		<div class="input-group">
																			<input type="text" class="form-control input-sm" placeholder="Código / Descripcion">
																			<span class="input-group-btn">
																				<button class="btn btn-default" style="padding: 4px 18px;" type="button">Buscar</button>
																			</span>
																		</div><!-- /input-group -->
																	</div>
																</div>
																<div class="row">
																	<div class="col-md-12">
																		<div class="table-responsive" style="margin: 4px, 4px;padding:4px;height: 320px;overflow-x: hidden;overflow-y: auto;overflow-x: auto;">
																			<table id="tblBProductos" class="table table-condensed table-striped">
																				<thead>
																					<tr>
																						<th class="titulos_principales"></th>
																						<th class="titulos_principales">Código</th>
																						<th style="width: 600px;" class="titulos_principales">Descripción</th>
																						<th class="titulos_principales">Unidad</th>
																						<th class="titulos_principales">Precio</th>
																						<th class="titulos_principales">Cantidad</th>
																						<th class="titulos_principales">Total</th>
																						<th class="titulos_principales">Acciones</th>
																					</tr>
																				</thead>
																				<tbody>
																				</tbody>
																			</table>
																		</div>
																	</div>
																	<input type="hidden" class="form-control input-sm text-right" id="txtBTotalProducto" placeholder="0.00" readonly />
																</div>
																<div class="row">
																	<div class="col-md-3 col-xs-12 col-md-offset-9 text-right">
																		<div class="form-inline form-group">
																			<label>Total: $ </label>
																			<input type="text" class="form-control input-sm text-right" name="txtValorEstimado" id="txtValorEstimado" placeholder="0.00" readonly>
																		</div>
																	</div>
																</div>
																</div>
																<div role="tabpanel" class="tab-pane" id="b_tiempovida">
																	<div id="divAlertaCriterio" class="alert alert-warning alert-dismissible text-center hide" role="alert">
																	<p id="msjResultadoCriterio"></p>
																</div>

																<div class="row">
																	<div class="col-md-5">
																		<div class="table-responsive">
																			<table id="tblCCheckList" class="table table-condensed table-hove">
																				<thead>
																					<tr>
																						<th>Concepto a Calificar</th>
																						<th>Pesimo</th>
																						<th>Malo</th>
																						<th>Regular</th>
																						<th>Bueno</th>
																						<th>Excelente</th>
																					</tr>
																				</thead>
																				<tbody>
																				</tbody>
																			</table>
																		</div>
																	</div>
																	<div class="col-md-7">
																		<div class="table-responsive">
																			<table id="tblTablaCriterio" class="table table-condensed table-hove">
																				<thead>
																					<tr>
																						<th class="text-center">Seguimiento</th>
																						<th nowrap class="text-center">Tiempo Vida</th>
																						<th nowrap class="text-center">Condición Pavimentación</th>
																						<th class="text-center">Calificación</th>
																						<th class="text-center">Criterio</th>
																					</tr>
																				</thead>
																				<tbody>
																					<tr class="success">
																						<td>3 Meses</td>
																						<td>18 Meses</td>
																						<td>Excelente</td>
																						<td class="text-center">100-80</td>
																						<td>Las condiciones de la carpeta son excelentes, no presenta ningun daño y es practicamente nueva o acaban de realizar mantenimiento.</td>
																					</tr>
																					<tr class="info">
																						<td>3 Meses</td>
																						<td>12 Meses</td>
																						<td>Bueno</td>
																						<td class="text-center">79-60</td>
																						<td>Es una carpeta que se encuentra en buen estado, sin embargo empieza a presentar pequeños daños en la superficie como baches, grietas, desgranado.</td>
																					</tr>
																					<tr class="active">
																						<td>3 Meses</td>
																						<td>6 Meses</td>
																						<td>Regular</td>
																						<td class="text-center">59-40</td>
																						<td>La carpeta empieza a presentar daños considerados.</td>
																					</tr>
																					<tr class="warning">
																						<td>Semanal</td>
																						<td>3 Meses</td>
																						<td>Malo</td>
																						<td class="text-center">39-20</td>
																						<td>La carpeta se encuentra en malas condiciones con muchos daños.</td>
																					</tr>
																					<tr class="danger">
																						<td>2 dias</td>
																						<td>1 Mes</td>
																						<td>Pesimo</td>
																						<td class="text-center">19</td>
																						<td>La carperta se encuentra en pesimas condiciones.</td>
																					</tr>
																				</tbody>
																			</table>
																		</div>
																	</div>
																</div>
																<div class="row">
																	<div class="col-md-2 col-xs-12 text-right">
																		<div class="form-group">
																			<input type="text" class="form-control input-sm text-right" name="txtPuntosTV" id="txtPuntosTV" placeholder="0.00">
																			<input type="hidden" class="form-control input-sm text-right" name="txtDesPuntosTV" id="txtDesPuntosTV">
																			<input type="hidden" class="form-control input-sm text-right" name="txtMesesPuntosTV" id="txtMesesPuntosTV">
																		</div>
																	</div>
																</div>
															</div>
														</div>
													</div>
												</div>

												</div>
												</div>
												<div class="wizard-footer">
													<input id="btnAtrasEtapaA" style="display:none" type='button' class='btn btn-default btn-wd btn-sm' value='Atras' />
													<input id="btnGuardarEtapaB" type='button' class='btn btn-fill btn-default btn-wd btn-sm' value='Guardar' data-loading-text="Guardando..." />
													<input id="btnSiguienteEtapaB" type='button' class='btn btn-fill btn-warning btn-wd btn-sm' value='Guardar' data-loading-text="Procesando..." />
													<!-- <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">Cerrar</button>  -->
												</div>
											</div>
											<div class="tab-pane" id="etapac">
												<div style="overflow-y:auto; flex:1; height:calc(85vh - 180px);">
												<input type="hidden" id="txtIdOrderNo" name="txtIdOrderNo" value="" />
												<div class='hide' id="divCCotizacion">
												<div class="row">
													<div class="col-md-12">
														<div class="jumbotron" style="padding:20px;">
															<h1>Cotización Realizada!</h1>
															<p>Ya se cuenta con una cotización para la oportunidad, click para visualizar PDF!</p>
															<p><a id="linkVerCotizacion" class="btn btn-primary btn-md" href="#" target="_blank" role="button">Ver Cotización</a>
																<button type="button" id="btnModCotizacion" class="btn btn-default btn-md" role="button">Modificar Cotización</button>
																<button type="button" id="btnSolCotizacion" class="btn btn-default btn-md" role="button">Solicitar Autorización</button>
																<button type="button" id="btnAutorizarCotizacion" class="btn btn-default btn-md btn-success <?= $disableAutorizarOV ?>" role="button">Autorizar Cotización</button>
															</p>
														</div>
													</div>
												</div>
											</div>
											<div class='' id="divCCotizar" style="overflow-y: scroll; height: 400px;">
												<div id="divErrorPrecio" class="row hide">
													<div class="col-md-12 col-xs-12">
														<div class="alert alert-danger" role="alert">
															<p id="lblMsjPrecioMal"></p>
														</div>
													</div>
												</div>
												<div class="row">
													<div class="col-md-3">
														<div class="form-group">
															<label>Unidad Negocio: </label>
															<select id="cmbUnidadesNegocio" class="form-control" tabindex="4" name="cmbUnidadesNegocio">
																<?php echo $optionUnidadNegocio ?>
															</select>
														</div>
													</div>
													<div class="col-md-2 col-xs-12">
														<div class="form-group">
															<label>KM planta / lugar: </label>
															<input type="text" class="form-control input-sm" id="txtKmPlanta2" placeholder="KM planta / lugar" readonly='true'>
														</div>
													</div>
													<div class="col-md-2 col-xs-12">
														<div class="form-group">
															<label>Área Total: </label>
															<input type="text" class="form-control input-sm" id="txtAreaTotal2" placeholder="Área Total" readonly='true'>
														</div>
													</div>
													<div class="col-md-3 col-xs-12">
														<div class="form-group">
															<label>Encargado Proyecto: </label>
															<input type="text" class="form-control input-sm" id="txtNombreEncargado2" placeholder="Nombre del Encargado" readonly='true'>
														</div>
													</div>
													<div class="col-md-2 col-xs-12">
														<div class="form-group">
															<label>Teléfono Encargado: </label>
															<input type="text" class="form-control input-sm" id="txtTelefonoEncargado2" placeholder="Teléfono del Encargado" readonly='true'>
														</div>
													</div>
												</div>
												<div class="row">
													<div class="col-md-1 col-xs-1">
														<label>Comentarios: </label>
													</div>
													<div class="col-md-11 col-xs-11">
														<input type="text" class="form-control input-sm" id="txtComentarios2" placeholder="Comentarios" readonly='true'>
													</div>
												</div>
												<div class="row">
													<div class="col-md-12 col-xs-12 text-right">
														<button class="btn btn-default mdlSelProductoB" data-tipo="Bacheo" style="padding: 4px 18px;" type="button">Bacheo</button>
														<button class="btn btn-default mdlSelProductoC" data-tipo="Fresado" style="padding: 4px 18px;" type="button">Fresado</button>
														<button class="btn btn-primary mdlSelProductoC" data-tipo="" style="padding: 4px 18px;" type="button">Buscar Conceptos</button>
													</div>
												</div>
												<div class="row">
													<div class="col-md-12">
														<div class="table-responsive" style="margin: 4px, 4px;padding:4px; overflow-x: hidden; overflow-y: auto; overflow-x: auto;">
															<table id="tblCProductos" class="table table-condensed table-hove">
																<thead>
																	<tr>
																		<th></th>
																		<th style="text-align: center;">Código</th>
																		<th style="width: 600px; text-align: center;">Descripción</th>
																		<th style="text-align: center;">Precio</th>
																		<th style="text-align: center;">Cantidad</th>
																		<th style="text-align: center;">IVA</th>
																		<th style="text-align: center;">Total</th>
																		<th style="text-align: center;">Acciones</th>
																	</tr>
																</thead>
																<tbody>
																</tbody>
															</table>
														</div>
													</div>
												</div>
													<div class="row">
														<div class="col-md-8">
														<div class="form-group">
															<label>Condiciones Comerciales</label>
															<textarea id="txtCondicionesComerciales" name="txtCondicionesComerciales" class="form-control" rows="5" style="resize: vertical;"></textarea>
														</div>
													</div>
													<div class="col-md-4 text-right">
														<div class="col-md-12">
															<div class="form-inline form-group">
																<label>SubTotal: $ </label>
																<input type="text" class="form-control input-sm text-right" id="txtCSubTotalProducto" placeholder="0.00" readonly />
															</div>
														</div>
														<div class="col-md-12">
															<div class="form-inline form-group">
																<label>IVA: $ </label>
																<input type="text" class="form-control input-sm text-right" id="txtCTotalIVAProducto" placeholder="0.00" readonly />
															</div>
														</div>
														<div class="col-md-12">
															<div class="form-inline form-group">
																<label>Total: $ </label>
																<input type="text" class="form-control input-sm text-right" id="txtCTotalProducto" placeholder="0.00" readonly />
															</div>
														</div>
													</div>
												</div>
												</div>
												</div>

												<div class="wizard-footer">
													<input id="btnAtrasEtapaB" style="display:none" type='button' class='btn btn-default btn-wd btn-sm' value='Atras' />
													<input id="btnSiguienteEtapaC" type='button' class='btn btn-fill btn-warning btn-wd btn-sm' value='Guardar' />
													<!-- <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">Cerrar</button> -->
												</div>
											</div>
											<div class="tab-pane" id="etapad">
												<div style="overflow-y:auto; flex:1; height:calc(85vh - 180px);">
												<div class="row">
												<div class="col-md-4 col-xs-12">
													<div class="form-group">
														<label><span style='color:red'>*</span> Fecha Cierre Estimada: </label>
														<div class="input-group ">
															<input id="txtFechaCierreEstimada" name="txtFechaCierreEstimada" type="text" placeholder="yyyy-mm-dd" class="form-control input-sm" value="" autocomplete="off">
															<div class="input-group-addon" id="iFechaCierreEstimada"><span class="glyphicon glyphicon-calendar" aria-hidden="true"></span></div>
														</div>
													</div>
												</div>
											</div>
											<div class="row">
												<div class="col-md-12 col-xs-12">
													<div class="form-group">
														<label><span style='color:red'>*</span>Comentarios: </label>
														<textarea id="txtComentariosCierre" name="txtComentariosCierre" class="form-control" rows="5" style="resize: vertical;"></textarea>
													</div>
												</div>
											</div>
												</div>
												<div class="wizard-footer">
													<input id="btnAtrasEtapaC" style="display:none" type='button' class='btn btn-default btn-wd btn-sm' value='Atras' />
													<input id="btnSiguienteEtapaD" type='button' class='btn btn-fill btn-warning btn-wd btn-sm' value='Guardar' />
													<!-- <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">Cerrar</button>  -->
												</div>
											</div>
										<div class="tab-pane" id="etapae">
											<div class="row">

											</div>
										</div>
										<div class="tab-pane" id="etapaf">
											<div class="row">

											</div>
										</div>
									</div>
								</form>
							</div>
						</div> <!-- wizard container -->
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Modal -->
<div class="modal fade" id="mdlAgendarCita" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
	<div class="modal-dialog" role="document"  style="width:90%; position:relative;" >
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				<h4 class="modal-title" id="myModalLabel">Agendar Cita</h4>
			</div>
			<div class="modal-body">
				<form id="frmAutorizarB">
					<div class="row">
						<input type="hidden" name="u_movimiento" id="u_movimiento" value="" />
						<div class="col-md-4 col-xs-12">
							<div class="form-group">
								<label><span style='color:red'>*</span> Fecha Visita: </label>
								<div class="input-group ">
									<input id="txtFechaVisita" name="txtFechaVisita" type="text" placeholder="yyyy-mm-dd" class="form-control input-sm" value="" autocomplete="off">
									<div class="input-group-addon" id="iFechaVisita"><span class="glyphicon glyphicon-calendar" aria-hidden="true"></span></div>
								</div>
							</div>
						</div>
						<div class="col-md-4 col-xs-12">
							<div class="form-group">
								<label><span style='color:red'>*</span>Nombre Oportunidad: </label>
								<input type="text" class="form-control input-sm" name="txtTituloCita" placeholder="">
							</div>
						</div>
						<div class="col-md-4 col-xs-12">
							<div class="form-group">
								<label><span style='color:red'>*</span>Vendedor: </label>
								<?php echo InsertaElemento("comisionistas", "cmbVendedorVisita", "", "", true, "id='cmbVendedorVisita' ", "form-control", false); ?>
							</div>
						</div>
						<div class="col-md-12 col-xs-12">
							<div class="form-group">
								<label> <span style='color:red'>*</span>Comentarios Oportunidad: </label>
								<input type="text" class="form-control input-sm" name="txtConceptoCita" placeholder="">
							</div>
						</div>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>
				<button type="button" class="btn btn-primary" onclick="fnAutorizarEtapaB()">Guardar</button>
			</div>
		</div>
	</div>
</div>

<!-- Modal de Imagenes-->
<div class="modal fade" id="mdlImagenesOportunidad" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" style="z-index: 1150;">
	<div class="modal-dialog modal-lg" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				<h4 class="modal-title" id="myModalLabel">Documentos Adjuntos</h4>
			</div>
			<div class="modal-body">
				<div id="divImagenes">
					<div class="row" id="divImagenGrid" style="height: 400px;line-height: 1em;overflow-x: hidden;overflow-y: scroll;width: 100%;">
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<div class="row">
					<div class="col-md-12 col-xs-12">
						<!--<div class="form-group">
							<input name="fileEvidenciasModal[]" type="file" id="fileEvidenciasModal" multiple="true">
						</div>-->
						<div class="col-md-12 subir-archivos">
							<form id="frmModalAdjuntos" method="POST" enctype="multipart/form-data">
								<input type="hidden" value="" name="u_oportunidad" id="u_oportunidad">
								<div class="form-group">
									<div class="input-group">
										<input placeholder="" type="text" class="form-control carga-archivo-filename" readonly id="txtMuestraArchivo">
										<span class="input-group-btn">
											<div class="btn btn-default carga-archivo-input">
												<span class="glyphicon glyphicon-folder-open"></span>
												<span class="carga-archivo-input-title">Seleccionar archivo</span>
												<input type="file" accept=".doc, .pdf, .xlsx, .txt, .jpg, .jpeg, .png, .*" name="fileEvidenciasModal[]" id="fileEvidenciasModal" multiple onchange="fnArchivosSeleccionados();" />
											</div>
										</span>
									</div>
								</div>
							</form>
							<div class="pull-left form-group">
								<span id="txtTamano">0 KB</span>
								<label id="divEsperaConvierteImagen" style="color: dodgerblue;">Procesando imagen/s por favor espere...</label>
								<div id="divImagenesConvertidas" class="hide" style="border: 1px solid lightgray; height: 70px; padding: 2px; border-radius: 5px; overflow-x: auto;"></div>
							</div>
							<button class="pull-right" type="button" class="btn btn-default" data-dismiss="modal" id="btnCerrarModalImagenes">Cerrar</button>
							<span class="pull-right">&nbsp;&nbsp;&nbsp;</span>
							<button class="pull-right" type="button" class="btn btn-primary" id="btnGuardarAdjuntos" data-sufijoid="">Guardar Imagen</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div><!-- /.modal -->

<div class="modal-content hide" id="div_234fasdf2rg">
	<div class="modal-header">
		<h4 class="modal-title" id="myModalLabel">Documentos Adjuntos</h4>
	</div>
	<div class="modal-body" style="height: 80%; overflow-x: hidden; overflow-y: scroll;">
		<div id="divImagenes_234fasdf2rg">
			<div class="row" style="margin-bottom: 10px;">
				<div class="col-md-12 col-xs-12">
					<div class="btn-group" role="group" aria-label="Categorias adjuntos" style="display: flex; flex-wrap: wrap; gap: 5px;">
						<button type="button" class="btn btn-default tab-categoria-adjunto_234fasdf2rg active" id="tabCategoria_todas_234fasdf2rg" onclick="fnFiltrarCategoriaAdjuntos('todas','_234fasdf2rg');" style="background:#337ab7;color:#fff;">Todos</button>
						<button type="button" class="btn btn-default tab-categoria-adjunto_234fasdf2rg" id="tabCategoria_documento_234fasdf2rg" onclick="fnFiltrarCategoriaAdjuntos('documento','_234fasdf2rg');">Documentos</button>
						<button type="button" class="btn btn-default tab-categoria-adjunto_234fasdf2rg" id="tabCategoria_pago_234fasdf2rg" onclick="fnFiltrarCategoriaAdjuntos('pago','_234fasdf2rg');">Pagos</button>
						<button type="button" class="btn btn-default tab-categoria-adjunto_234fasdf2rg" id="tabCategoria_imagen_234fasdf2rg" onclick="fnFiltrarCategoriaAdjuntos('imagen','_234fasdf2rg');">Imágenes</button>
					</div>
				</div>
			</div>
			<div class="row" id="divImagenGrid_234fasdf2rg" style="line-height: 1em; width: 100%;">
			</div>
		</div>
	</div>
	<div class="modal-footer">
		<div class="row">
			<div class="col-md-12 col-xs-12">
				<!--<div class="form-group">
					<input name="fileEvidenciasModal[]" type="file" id="fileEvidenciasModal" multiple="true">
				</div>-->
				<div class="col-md-12 subir-archivos">
					<form id="frmModalAdjuntos_234fasdf2rg" method="POST" enctype="multipart/form-data">
						<input type="hidden" value="" name="u_oportunidad_234fasdf2rg" id="u_oportunidad_234fasdf2rg">
						<div class="form-group">
							<label for="cmbCategoriaArchivo_234fasdf2rg">Categoría del archivo</label>
							<select class="form-control" name="cmbCategoriaArchivo_234fasdf2rg" id="cmbCategoriaArchivo_234fasdf2rg">
								<option value="imagen" selected>Imagen</option>
								<option value="documento">Documento</option>
								<option value="pago">Pago</option>
							</select>
						</div>
						<div class="form-group">
							<div class="input-group">
								<input placeholder="" type="text" class="form-control carga-archivo-filename" readonly id="txtMuestraArchivo_234fasdf2rg">
								<span class="input-group-btn">
									<div class="btn btn-default carga-archivo-input">
										<span class="glyphicon glyphicon-folder-open"></span>
										<span class="carga-archivo-input-title">Seleccionar archivo</span>
										<input type="file" accept=".doc, .pdf, .xlsx, .txt, .jpg, .jpeg, .png, .*" name="fileEvidenciasModal_234fasdf2rg[]" id="fileEvidenciasModal_234fasdf2rg" multiple onchange="fnArchivosSeleccionados('_234fasdf2rg');" />
									</div>
								</span>
							</div>
						</div>
					</form>
					<div class="pull-left form-group">
						<span id="txtTamano_234fasdf2rg">0 KB</span>
						<label id="divEsperaConvierteImagen_234fasdf2rg" style="color: dodgerblue;">Procesando imagen/s por favor espere...</label>
						<div id="divImagenesConvertidas_234fasdf2rg" class="hide" style="border: 1px solid lightgray; height: 70px; padding: 2px; border-radius: 5px; overflow-x: auto;"></div>
					</div>
					<span class="pull-right">&nbsp;&nbsp;&nbsp;</span>
					<button type="button" class="pull-right btn btn-primary hide" id="btnGuardarAdjuntos_234fasdf2rg" data-sufijoid="_234fasdf2rg" onclick="fnGuardarAdjuntos('_234fasdf2rg');">Guardar Archivo</button>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Modal Coincidencias Prospecto-->
<div class="modal fade" id="mdlCoincidenciasProspecto" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" style="z-index: 1400;">
	<div class="modal-dialog" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				<h4 class="modal-title" id="myModalLabel">Coincidencias Prospecto</h4>
			</div>
			<div class="modal-body">
				<div class="table-responsive">
					<table id="tblCoincidenciasProspecto" class="table table-condensed table-hover table-striped">
						<thead>
							<tr>
								<th class="titulos_principales text-center">Accion</th>
								<th class="titulos_principales text-center">Nombre</th>
								<th class="titulos_principales text-center">Fecha</th>
								<th class="titulos_principales text-center">Usuario</th>
							</tr>
						</thead>
						<tbody>
						</tbody>
					</table>
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>
			</div>
		</div>
	</div>
</div><!-- /.modal -->

<!-- Modal de FActura, Cotizaciones, Anticipos -->
<div class="modal fade" id="mdlDocAdministrativos234erfasdf" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" style="z-index: 1150;">
	<div class="modal-dialog modal-lg" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				<h4 class="modal-title" id="myModalLabel">Documentos Generados en la Oportunidad</h4>
			</div>
			<div class="modal-body">
				<div id="divDocumentos234erfasdf">
					<div class="table-responsive ">
						<table id="tblDocAdministrativos234erfasdf" class="table table-condensed table-hover table-striped">
							<thead>
								<tr>
									<th class="titulos_principales">#</th>
									<th class="titulos_principales">Folio</th>
									<th class="titulos_principales">Tipo</th>
									<th class="titulos_principales">Monto</th>
									<th class="titulos_principales">Fecha</th>
									<th class="titulos_principales">Usuario</th>
								</tr>
							</thead>
							<tbody>
							</tbody>
						</table>
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>
			</div>
		</div>
	</div>
</div>

<!-- Modal de FActura, Cotizaciones, Anticipos-->
<div class="modal fade" id="mdlModifciarEstatus" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" style="z-index: 1150;">
	<div class="modal-dialog" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				<h4 class="modal-title" id="myModalLabel">Modificar Etapa</h4>
			</div>
			<div class="modal-body">
				<form id="frmCambiarEstatus" name="frmCambiarEstatus">
					<input type="hidden" value="" name="u_oportunidad_" id="u_oportunidad_">
					<input type="hidden" value="" name="txtEstatusActual" id="txtEstatusActual">
					<div class="row">
						<div class="col-md-4">
							<label>Fecha Compromiso:</label>
							<div class="input-group">
								<input id="txtModificarFechaActividad" name="txtModificarFechaActividad" type="text" placeholder="yyyy-mm-dd" class="form-control input-sm" value="" autocomplete="off">
								<div class="input-group-addon" id="divModificaFechaActividad"><span class="glyphicon glyphicon-calendar" aria-hidden="true"></span></div>
							</div>
						</div>
						<div class="col-md-4">
							<div class="form-group">
								<label class="pull-left">Etapa:</label>
								<? echo InsertaElemento("comboestatusprospectos", "cmbCambiarEstatus", "", "", true, "id='cmbCambiarEstatus' ", "form-control", false); ?>
							</div>
						</div>
						<div class="col-md-4 col-xs-12">
							<div class="form-group">
								<label class="pull-left">Vendedor:</label>
								<? echo InsertaElemento("comisionistas", "cmbVendedor03", $_POST["cmbVendedor03"], "", true, "id='cmbVendedor03'", "form-control", false); ?>
							</div>
						</div>

						<div class="col-md-12 col-xs-12">
							<div class="form-group">
								<label>Comentarios: </label>
								<textarea id="txtComentarioCambioEtapa" name="txtComentarioCambioEtapa" class="form-control" rows="3" style="resize: vertical;"></textarea>
							</div>
						</div>

					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>
				<button type="button" class="btn btn-primary" id="btnGuardarCambioEstatus">Guardar</button>
			</div>
		</div>
	</div>
</div><!-- /.modal -->

<!-- Modal Notificaciones-->
<div class="modal fade" id="mdlNotificaciones" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
	<div class="modal-dialog mdlContenedorNotificaciones fadeInRight animated" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				<h4 class="modal-title">Notificaciones</h4>
			</div>
			<div class="modal-body">
				<div id="divNotificacionPrincipal" style="height: 30em;line-height: 1em;overflow-x: hidden; overflow-y: scroll;width: 100%;">
					<div class="row" id="divRowPrincipalNotificaciones">

					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>
			</div>
		</div>
	</div>
</div><!-- /.modal -->

<!-- Modal Editar Productos-->
<div class="modal fade" id="mdlEditarProductos" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" style="z-index: 1400; align-content: center;">
	<div class="modal-dialog modal-lg" role="document" style="width:50%">
		<div class="modal-content">
			<div class="modal-header">
				<h4 class="modal-title" id="codigoProducto"></h4>
			</div>
			<div class="modal-body">
				<div class="row">
					<div class="col-md-12">
						<input type="hidden" name="idProducto" id="idProducto">
						<input type="hidden" name="idModificacionProspecto" id="idModificacionProspecto">
						<label>Descripción del producto</label>
						<textarea id="txtModificarProducto" name="txtModificarProducto" class="form-control input-sm" value="" style="height: 140px;"></textarea>
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>
				<button type="button" class="btn btn-primary btnEditarProductos" id="btnEditarProductos">Modificar</button>
			</div>
		</div>
	</div>
</div><!-- /.Modal Editar Productos -->

<!-- Modal Seleccionar Productos-->
<div class="modal fade" id="mdlBuscarProductos" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" style="z-index: 1400;">
	<div class="modal-dialog modal-lg" role="document" style="width:80%">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				<h4 class="modal-title">Productos</h4>
			</div>
			<div class="modal-body">
				<div class="row">
					<input type="hidden" value="" id="idEtapaBusqueda" />
					<div class="col-md-12">
						<div class="table-responsive" style="margin: 4px, 4px;padding:4px;height: 410px;overflow-x: hidden;overflow-y: auto;overflow-x: auto;">
							<table id="tblBusquedaProductos" class="table table-condensed table-striped">
								<thead>
									<tr>
										<th>Sel</th>
										<th>Código</th>
										<th style="width: 600px;">Descripción</th>
										<th>Unidad</th>
									</tr>
								</thead>
								<tbody>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>
				<button type="button" class="btn btn-primary" id="btnAgregarProductos">Agregar</button>

			</div>
		</div>
	</div>
</div><!-- /.Modal Seleccionar Productos -->

<!-- Plantilla html para mostrar la informacion del prospecto -->
<div id="divContenedorProspecto" style="display:none;">
	<div class="panel panel-default">
		<div class="panel-heading">
			<div class="row">
				<div class="col-md-5" style="padding-top: 6px;">
					<a data-toggle="collapse" href="#coldatosprospecto" aria-expanded="false" aria-controls="coldatosprospecto" style="font-size: 10pt;">
						<span class="glyphicon glyphicon-user" aria-hidden="true"></span>&nbsp;&nbsp;Datos Generales Prospecto
					</a>
				</div>
				<div class="col-md-2 text-right" style="color: slategray;border: 1px solid lightgray;border-radius: 5px;padding-top: 4px;">
					<label>Sup: <span id="lblInfoSuperficie">2000 m2</span></label>
				</div>
				<div class="col-md-2 text-right" style="color: slategray;border: 1px solid lightgray;border-radius: 5px;padding-top: 4px;">
					<label class="">Estimado:&nbsp;
						<span id="lblInfoValorEstimado">$0</span>
						<span id="spEstimadoProductos" class="glyphicon glyphicon-th-list" aria-hidden="true" style="font-size: 9pt;color: darkturquoise;"></span>
					</label>
				</div>
				<div class="col-md-3 text-right" id="divFechaCompromiso" style="color: slategray;border: 1px solid lightgray;border-radius: 5px;padding-top: 4px;">
					<label>Cierre:&nbsp;</label>
					<span id="lblFechaComp">2025-04-08</span>
					<span class="badge" style="background-color: slategrey; color: whitesmoke;" id="spCierreVencido">
						Vence 361d</span>
				</div>
			</div>
		</div>
		<div id="coldatosprospecto" class="panel-body collapse in">
			<div class="row" id="iiausdfo734qo8asugsdvjkdG">
				<div class="col-xs-1 col-sm-1 col-md-1 text-center" style="margin-top: 5px;" id="divLogoEtapa">
					<img id="imgInfoLogo" width=50 height=50 src="images/iconoA.png" onclick="fnEtapaB('asdfasdf');">
					<span id="lblInfoEtapa"></span>
				</div>

				<!-- Add the extra clearfix for only the required viewport -->
				<div class="clearfix visible-xs-block"></div>

				<div class="col-md-5">
					<div class="row">
						<label>Oportunidad:&nbsp;</label><span id="lblInfoOportunidad">452345</span>
					</div>
					<div class="row">
						<label>Prospecto:&nbsp;</label><span id="lblInfoProspecto">Prueba de nuevo prospecto</span>
					</div>
					<div class="row">
						<label>Contacto:&nbsp;</label><span id="lblInfoContacto">Prueba de nuevo prospecto</span>
					</div>
					<div class="row">
						<label>Telefono:&nbsp;</label><span id="lblInfoTelefono">4422472967</span>
					</div>
					<div class="row">
						<label>Correo:&nbsp;</label><span id="lblInfoCorreo">asdf@asdf.com</span>
					</div>
					<div class="row">
						<label>Sector:&nbsp;</label><span id="lblInfoSector">algo</span>
					</div>
				</div>

				<div class="col-md-3">
					<div class="row">
						<label>Vendedor:&nbsp;</label><span id="lblInfoVendedor">Sergio Centeno</span>
					</div>
					<div class="row">
						<label>Fuente:&nbsp;</label><span id="lblInfoFuente">Recomendado</span>
					</div>
					<div class="row">
						<label>Clasificacion:&nbsp;</label><span id="lblInfoClasificacion34234sd"></span>
					</div>
					<!--<div class="row" id="divFechaCompromiso" style="background-color: lightgreen; border-radius: 15px; padding-left: 10px;">
						<label>Cierre:&nbsp;</label>
						<span id="lblFechaComp">2024-04-10</span>
						<span class="badge pull-right" style="background-color: slategrey;" id="spCierreVencido">Vence 4d</span>
					</div>-->
				</div>

				<div class="col-md-3 text-center">
					<div class="panel panel-default" style="padding-top: 10px; padding-bottom: 10px;" id="cntBotonesAcciones">
						<button id="btnAgregaNuevaActividad" type="button" class="btn btn-default" data-toggle="tooltip" data-placement="right" title="" data-original-title="Nueva Actividad" onclick="fnGeneraNuevaActividad();">
							<span class="glyphicon glyphicon-calendar" aria-hidden="true"></span>
						</button>
						<span>|</span>
						<button type="button" class="btn btn-default" data-toggle="tooltip" data-placement="right" title="" data-original-title="Ver Mapa">
							<span class="glyphicon glyphicon-map-marker" aria-hidden="true"></span>
						</button>
						&nbsp;
						<button type="button" class="btn btn-default " data-toggle="tooltip" data-placement="right" title="" onclick="fnDocumentosAdmin(28566);" data-original-title="Imprimir Documentos">
							<span class="glyphicon glyphicon-print" aria-hidden="true"></span>
						</button>
						&nbsp;
						<button type="button" class="btn btn-default " onclick="fnMostrarImagenOportunidad(28566);" data-toggle="tooltip" data-placement="right" title="" data-original-title="Ver Imagenes">
							<span class="glyphicon glyphicon-picture" aria-hidden="true"></span>
						</button>
					</div>
				</div>

				<div id="asdfasfasdfsdf" class="col-md-6">
					<div class="row">
						<div style="background-color: #F2F2F2;display: flex;height: 27px;border: 1px solid lightgray;margin-right: 15px;margin-left: 10px; border-radius: 10px;" class="row">
							<div style="width: 80%;display: -webkit-inline-box;" id="progresos">
								<div id="ssdf" style="text-align: center; color:white; background-color: #f65457;width: 20%;padding-top: 3px;"><span>10d</span></div>
								<div id="ssdf" style="text-align: center; color:white; background-color: #157eab;width: 10%;padding-top: 3px;"><span>10d</span></div>
								<div id="ssdf" style="text-align: center; color:white; background-color: #017a14;width: 10%;padding-top: 3px;"><span>10d</span></div>
								<div id="ssdf" style="text-align: center; color:white; background-color: #f8d242;width: 10%;padding-top: 3px;"><span>10d</span></div>
								<div id="ssdf" style="text-align: center; color:white; background-color: #dd6000;width: 50%;padding-top: 3px;"><span>10d</span></div>
							</div>
							<div id="totaldias" style="text-align: center; font-weight: bold; width: 20%;padding-top: 3px;">27d</div>
						</div>
					</div>
					<div class="row">
						<div style="display: flex;height: 27px;margin-right: 15px;margin-left: 10px;" class="row">
							<div id="progresos2" style="width: 80%;display: -webkit-inline-box;">
								<div class="text-center" style="width: 20%;">
									<img id="imgInfoLogo" width="20" height="20" src="images/iconoA.png" border="0">
								</div>
								<div class="text-center" style="width: 10%;">
									<img id="imgInfoLogo" width="20" height="20" src="images/iconoA.png" border="0">
								</div>
								<div class="text-center" style="width: 10%;">
									<img id="imgInfoLogo" width="20" height="20" src="images/iconoA.png" border="0">
								</div>
								<div class="text-center" style="width: 10%;">
									<img id="imgInfoLogo" width="20" height="20" src="images/iconoA.png" border="0">
								</div>
								<div class="text-center" style="width: 50%;">
									<img id="imgInfoLogo" width="20" height="20" src="images/iconoA.png" border="0">
								</div>
							</div>
						</div>
					</div>
				</div>
				<div id="divCalificacion" class="pull-right" style="background-color: cornsilk; border-radius: 25px; height: 36px; padding-top: 7px; width: 143px; border: 1px solid #F2F2F2; margin-right: 12px; text-align: center; color: slategrey; font-weight: bold;"><label>Calificacion: <span id="spADSfasdfaswn98374">0</span>%</label></div>
			</div>
		</div>
	</div>

	<div class="panel panel-default">
		<!-- Default panel contents -->
		<div class="panel-heading">
			<a data-toggle="collapse" href="#coldatosprospecto" aria-expanded="false" aria-controls="coldatosprospecto" style="font-size: 10pt;">
				<span class="glyphicon glyphicon-list" aria-hidden="true"></span>&nbsp;&nbsp;Detalle de Actividades
			</a>
		</div>

		<!-- Table -->
		<div class="table-responsive">
			<table class="table table-striped">
				<thead>
					<tr>
						<td class="titulos_principales">Fecha/Hora</td>
						<td class="titulos_principales">Tipo</td>
						<td class="titulos_principales">Descripcion</td>
						<td class="titulos_principales">Califica</td>
						<td class="titulos_principales">Etapas</td>
						<td class="titulos_principales">Acciones</td>
						<td class="titulos_principales">Usuario</td>
					</tr>
				</thead>
				<tbody id="tbInfoActividades">

				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Modal para guardar nueva actividad-->
<div class="modal fade" id="modalNuevaActividad" tabindex="-1" role="dialog" style="z-index: 2050;" data-backdrop="static" data-keyboard="false">
	<div class="modal-dialog modal-lg" role="document">
		<div class="modal-content">
			<div class="modal-header" style="background-color: whitesmoke;">
				<!--<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>-->
				<h4 class="modal-title">Agregar Nueva Actividad</label><input id="txAasdfasdfiq3b82347b8" type="hidden" value="<? echo $_SESSION['UserID']; ?>"></h4>
				<label style="color: slategray;">Oportunidad:&nbsp;<span id="lblProspectoIDActividad"></span></label><span>&nbsp;&nbsp;</span>
				<label style="color: slategray;">Prospecto:&nbsp;<span id="lblProspectoNombreActividad"></span></label>
				<input type="hidden" value="" name="idvendedor" id="idvendedor">
				<div class="text-center pull-right" style="margin-top: -28px;" id="divLogoEtapaActividad">
					<img id="imgInfoLogo" width="50" height="50" src="images/iconoB.png" border="0" style="cursor: pointer;">
					<span id="lblInfoEtapaActividad">Etapa B</span>
				</div>
			</div>
			<div class="modal-body" id="cntElementosActividad" style="height: 800px;">
				<div class="col-md-3 col-xs-12">
					<div class="form-group">
						<label class="">Fecha Actividad:</label>
						<div class="input-group">
							<input id="txtFechaActividadNuevo" name="txtFechaActividadNuevo" type="text" placeholder="yyyy-mm-dd" class="form-control input-sm" value="<?php echo date("Y-m-d"); ?>" autocomplete="off">
							<div class="input-group-addon" id="divFechaActividad"><span class="glyphicon glyphicon-calendar" aria-hidden="true"></span></div>
						</div>
					</div>
				</div>
				<div class="col-md-2 col-xs-12">
					<div class="form-group">
						<label class="">Hr:</label>
						<? echo $elementos->fnCmbHoras("cmbHoras", $_POST["cmbHoras"], "position: relative; z-index:2100;", "class='form-control'"); ?>
					</div>
				</div>
				<div class="col-md-2 col-xs-12">
					<div class="form-group">
						<label class="">Min:</label>
						<? echo $elementos->fnCmbMinutos("cmbMinutos", $_POST["cmbMinutos"], "position: relative; z-index:2100;", "class='form-control'"); ?>
					</div>
				</div>
				<div class="col-md-5 col-xs-12">
					<div class="form-group">
						<label>Tipo Actividad: </label>
						<select id="cmbTipoActividadNuevo" class="form-control" name="cmbTipoActividadNuevo" style="position: relative; z-index:2100;">
							<?php echo $optionTipoActividad; ?>
						</select>
					</div>
				</div>
				<div class="col-md-12 col-xs-12">
					<div class="form-group">
						<label class="pull-left">Descripción:</label>
						<? echo InsertaElemento("editor02", "txtDescripcionActividadNuevo", $_POST["txtDescripcionActividadNuevo"], "resize: none; position: relative; z-index:2100;", true, "id='txtDescripcionActividadNuevo' class='form-control' rows='3'", "", false); ?>
					</div>
				</div>
				<!-- <div class="col-md-6">
					<div class="btn-group" data-toggle="buttons">
						<label class="btn btn-default contactado" id="label1">
							<input type="radio" name="contactoRespuesta" id="option1" value="1"> Contactado
						</label>
						<label class="btn btn-default active" id="label2">
							<input type="radio" name="contactoRespuesta" id="option2" value="0"> Sin contacto
						</label>
					</div>
				</div> -->
				<div class="col-md-12 text-right" style="margin-bottom: 10px;">
					<label id="lblMensajeNuevaActividad" class="pull-left hide" style="color: green;">Se genero nueva actividad con numero:<span id="lblNumeroActividadNueva">0</span></label>
					<button type="button" class="btn btn-primary" id="btnGuardarActividadNuevo">Guardar Actividad</button>
					<button type="button" class="btn btn-default hide" data-dismiss="modal" aria-label="Close" id="btnCerrarActividad">Cerrar</button>
				</div>
				<div class="container-fluid">
					<ul class="nav nav-tabs nav-justified" style="padding-bottom: 5px;">
						<li role="presentation" class="active"><a onclick="changeTab(this, 'agendaModal')">Agenda</a></li>
						<li role="presentation"><a onclick="changeTab(this, 'mapaModal')">Mapa</a></li>
					</ul>

					<div id="agendaModal" class="tab-content active pestanaMapa">
						<div class="col-md-12" style="padding-top: 15px;">
							<div class="x_content" style="height: 470px;">
								<div id='divCalendarioActividad'></div>
							</div>
						</div>
					</div>

					<div id="mapaModal" class="tab-content pestanaMapa">
						<div id="mapNavegacion" style="height: 500px;"></div>
					</div>
				</div>
			</div>
		</div><!-- /.modal-content -->
	</div><!-- /.modal-dialog -->
</div><!-- /.modal -->

<div class="modal fade" id="modalUsoGeneral" tabindex="-1" role="dialog" style="z-index: 2050;">
	<div class="modal-dialog modal-lg" role="document">
		<div class="modal-content" style="height: 550px;">
			<div class="modal-header" style="background-color: whitesmoke;">
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				<h4 class="modal-title" id="lblUsoGeneralTitulo"></h4>
			</div>
			<div class="modal-body" style="overflow: auto;">
				<div class="table-responsive" style="height: 400px;" id="tblUsoGeneralDatos">

				</div>
			</div>
			<div class="modal-footer">
				<div class="pull-right" style="font-weight: bold;">
					<span>Totales: $ </span>
					<span id="lblUsoGeneralTotalDatos"></span>
					<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
				</div>
			</div>
		</div><!-- /.modal-content -->
	</div><!-- /.modal-dialog -->
</div><!-- /.modal -->

<!--   Core JS Files   -->

<!--   Core JS Files   
<script src="wizard/js/jquery-2.2.4.min.js" type="text/javascript"></script>
<script src="wizard/js/bootstrap.min.js" type="text/javascript"></script> -->

<script src="wizard/js/jquery.bootstrap.wizard.js" type="text/javascript"></script>

<!--  Plugin for the Wizard -->

<script src="wizard/js/demo.js" type="text/javascript"></script>
<script src="wizard/js/paper-bootstrap-wizard.js" type="text/javascript"></script>

<!--  More information about jquery.validate here: https://jqueryvalidation.org/	 -->
<script src="wizard/js/jquery.validate.min.js" type="text/javascript"></script>
