var blnModificarCotizacion = false;
var blnCargarCicloTiempoVida = true;
var objProductosSeleccionados=[];
var objProductosSeleccionadosC=[];
var etapaAImagenUploader = null;
var idEstatusActual = 0;

$(document).ready(function(){

    var datapicker_config = {
        dateFormat: "yy-mm-dd",
        defaultDate:  "Now",
        dayNames: [ "Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado" ],
        dayNamesShort: [ "Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab" ],
          dayNamesMin: [ "Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa" ],
        monthNames: [ "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" ],
        monthNamesShort: [ "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic" ]
    };

    fnFormatoTablaGeneralBasico("#tblCoincidenciasProspecto", "Coincidencias Prspecto",[0,1,2]);

    fnFormatoTablaGeneralBasico("#tblBusquedaProductos", "Productos",[],[],[],[],[],true);
    var select_config = {
        enableFiltering: true,
        enableCaseInsensitiveFiltering: true,
        includeSelectAllOption: false,
        maxHeight: 200,
        buttonWidth: '300px',
        nonSelectedText:"Seleccionar",
        selectAllText: "Seleccionar todos",
        numberDisplayed: 1
    };
    $('#CustLeadSourceId, #SectComClId, #estado_pros, #contactsmensid, #cmbUnidadesNegocio, #cmbVendedorVisita, #cmbVendedor, #cmbVendedorMulti').multiselect({
        buttonWidth: '100%',
        maxHeight: 340,
        enableFiltering: true,
        includeSelectAllOption: true,
        enableCaseInsensitiveFiltering: true,
        filterPlaceholder: "Buscar...",
        nonSelectedText:"Seleccionar...",
        selectAllText: "Seleccionar todos",
    });
    /*$("#txtDesde,#txtFechaTentativa, #txtFechaVisita").datepicker(datapicker_config);

    $('#idesde').on('click', function() {
        $('#txtDesde').datepicker('show');
    });

    $('#iTentativa').on('click', function() {
        $('#txtFechaTentativa').datepicker('show');
    });

    $('#iFechaVisita').on('click', function() {
        $('#txtFechaVisita').datepicker('show');
    });*/

    /*$('#estado, #SectComClId, #cmbVendedor, #contactsmensid, #CustLeadSourceId, #giro').multiselect({
        buttonWidth: '100%',
        maxHeight: 340,
        enableFiltering: true,
        includeSelectAllOption: true,
        enableCaseInsensitiveFiltering: true,
        filterPlaceholder: "Buscar..."
    });*/
    var datapicker_config = {
        dateFormat: "yy-mm-dd",
        defaultDate:  "Now",
        dayNames: [ "Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado" ],
        dayNamesShort: [ "Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab" ],
          dayNamesMin: [ "Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa" ],
        monthNames: [ "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" ],
        monthNamesShort: [ "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic" ],
        beforeShow: function(){
            setTimeout(function (){
                $(".ui-datepicker").css("z-index", 2000);
            }, 0);
        }
    };

    $("#txtFechaVisita").datepicker(datapicker_config);
    $('#iFechaVisita').on('click', function() {
        $('#txtFechaVisita').datepicker('show');
    });
    $("#txtFechaCierreEstimada").datepicker(datapicker_config);
    $('#iFechaCierreEstimada').on('click', function() {
        $('#txtFechaCierreEstimada').datepicker('show');
    });

    // $("#txtLinkMapa_pros").replace(/\s+/g, '');

    $("#btnSiguienteEtapaA").click(function(){
        if(fnValidarCamposEtapaA()){
            if(fnInsertarEtapaA()){
                if($("#idOportunidad").val()==""){
                    fnLimpiarModalProspecto();
                }
            }
        }  
    });

    $("#btnSiguienteEtapaB").click(function(){
        fnGuardarEtapaB();
    });

    $("#btnGuardarEtapaB").click(function(){
        fnGuardarEtapaB( true);
    });

    $("#liBuscarCheckTiempoVida").click(function(){
        fnMostrarCheckTiempoVida();
    });

    $("#btnNuevoProspecto").click(function(){
        fnLimpiarModalProspecto();
        fnRenderWizard('0',{});
    });

    $("#btnSiguienteEtapaC").click(function(){
        let blnGuardar = true;

        /*if($("#txtIdOrderNo").val()!="" && blnModificarCotizacion== false ){
            blnGuardar = false;
        }*/

        if(blnGuardar){
            fnGuardarEtapaC();
        }
    });

    $("#btnSiguienteEtapaD").click(function(){
        fnGuardarEtapaD()
    });

    $("#btnGuardarActividad").click(function(){
        fnGuardarActividad();
    });

    $("#btnGuardarActividadNuevo").click(function(){
        $(this).prop("disabled", "disabled");
        fnGuardarActividadNuevo();
        $(this).prop("disabled", "");
        $("#btnCerrarActividad").removeClass("hide");
    });

    $("#btnModCotizacion").click(function(){
        blnModificarCotizacion= true;
        $("#divCCotizacion").addClass("hide");
        $("#divCCotizar").removeClass("hide");
    });

    $("#btnAtrasEtapaB").click(function(){
        $('.liEtapas').removeClass('active');
        $('.tab-pane').removeClass('active');
        $('#liEtapaB').addClass("active");
        $('#etapab').addClass("active");
        $('#b_informacion').addClass("active");
    });

    $("#btnAtrasEtapaA").click(function(){
        $('.liEtapas').removeClass('active');
        $('.tab-pane').removeClass('active');
        $('#liEtapaA').addClass("active");
        $('#etapaa').addClass("active");
    });

    $("#btnAtrasEtapaC").click(function(){
        $('.liEtapas').removeClass('active');
        $('.tab-pane').removeClass('active');
        $('#liEtapaC').addClass("active");
        $('#etapac').addClass("active");
    });  

    $("#btnAutorizarCotizacion").click(function(){
        fnAutorizarCotizacion();
    });

    $("#btnSolCotizacion").click(function(){
        fnSolicitarAutorizarCotizacion();
    });

    $("#btnGuardarAdjuntos").click(function(){
        fnGuardarAdjuntos("");
    });

    $("#btnGuardarCambioEstatus").click(function(){
        fnGuardarCambioEstatus();
    });

    etapaAImagenUploader = new EtapaAImagenUploader();
    etapaAImagenUploader.init();

    fnMostrarNotificaciones();

    $(".mdlSelProductoB").click(function(){
        if ($(this).prop("disabled")) return;
        filtro = $(this).data("tipo");
        fnModalBuscarProductos(filtro,"B");
    });

    $(".mdlSelProductoC").click(function(){
        filtro = $(this).data("tipo");
        fnModalBuscarProductos(filtro,"C");
    });

    $("#btnAgregarProductos").click(function(){
        if($("#idEtapaBusqueda").val()=="B"){
            fnAgregarPartidas();
        }else{
            fnAgregarPartidasC();
        }
        $("#mdlBuscarProductos").modal("hide");
    });


});

$(document).on("blur",".clsCantidadProducto",function() {
    fnCalcularValorEstimado();
});

$(document).on("blur",".clsCantidadProductoC",function() {
    fnCalcularTotalCotizacion();
});

$(document).on("blur",".clsPrecioCNew",function() {
    var precio_mod = parseFloat($(this).val());
    var precio_lista = parseFloat($(this).data('precio'));
    var stockid = $(this).data('stockid');

    /*if(precio_mod < precio_lista){
        $(this).val(precio_lista);
        $("#divErrorPrecio").removeClass("hide");
        $("#lblMsjPrecioMal").text("El precio del producto "+stockid+", no puede ser menor al precio de lista.");
        return false;
    }else{
        $("#divErrorPrecio").addClass("hide");
        $("#lblMsjPrecioMal").text("");
    }*/
    fnCalcularTotalCotizacion();
});

$(document).on("click",".clsCheckTiempoVida",function() {
    fnCalcularPuntosTiempoVida();
});

$(document).on("click",".btnRespuestaComentario",function() {
    var btn = $(this);
    var idActividad = btn.data('actividad');
    if(btn.hasClass("downComentarios")){
        btn.addClass("upComentarios");
        btn.removeClass("downComentarios");
        $("#rowComentario_"+idActividad).addClass("hide");
    }else{
        btn.addClass("downComentarios");
        btn.removeClass("upComentarios");
        $("#rowComentario_"+idActividad).removeClass("hide");
    }
});

$(document).on("click",".btnAgregaRespuesta",function() {
    var btn = $(this);
    var actividad_id= btn.data("actividad");

    if(!$("#rowComentario_"+actividad_id).hasClass("tienerespuesta")){
        $("#rowComentario_"+actividad_id).removeClass("hide");
    }

    if($("#cntRespuesta_"+actividad_id).hasClass("hide")){
        $("#cntRespuesta_"+actividad_id).removeClass("hide");
    }else{
        $("#cntRespuesta_"+actividad_id).addClass("hide");
    }

    $("#cntContacto_"+actividad_id).hasClass("hide") ? $("#cntContacto_"+actividad_id).removeClass('hide') : $("#cntContacto_"+actividad_id).addClass('hide');
    
});

$(document).on("click",".btnAgregarComentario",function() {
    var btn = $(this);
    var idActividad = btn.data('actividad');
    fnGuardarComentario(idActividad, $("#inputComentario_"+idActividad).val());
});

$(document).on("click",".btnAgregarComentarioNuevo",function() {
    var btn = $(this);
    var idActividad = btn.data('actividad');
    var prospectoid = btn.data('prospectoid');
    var nombre = btn.data('nombre');
    var vendedorid = btn.data('vendedorid');
    var checkedValue = $('.contactoCheckbox:checked').val();

    if(checkedValue == undefined){
        return fnAlertaGeneral("Contacto", "Selecciona una respuesta de contacto", "info");
    }

    if ($("#txtRespuesta_"+idActividad).val() != ""){
        fnGuardarComentarioNuevo(idActividad, $("#txtRespuesta_"+idActividad).val(), checkedValue);
        fnGeneraNuevaActividad(prospectoid, nombre, vendedorid, true);
        fnTraeInfoProspecto(prospectoid);
    } else {
        return fnAlertaGeneral("Informacion", "Se requiere capturar una respuesta", "info");
    }
});

$(document).on("click",".contactoCheckbox",function() {
    var siContacto = document.getElementById("siContacto");
    var noContacto = document.getElementById("noContacto");

    siContacto.addEventListener("change", function() {
        if (siContacto.checked) {
            noContacto.checked = false;
        }
    });

    noContacto.addEventListener("change", function() {
        if (noContacto.checked) {
            siContacto.checked = false;
        }
    });
});

$(document).on("blur","#aPaterno",function() {
    //console.log("Revisar Prospecto");
    fnCoincidenciasProspecto();
});

$(document).on("click",".btnEliminarRow",function() {
    $(this).parent().parent().remove(); 
    fnCalcularValorEstimado();
});

$(document).on("click",".btnEliminarRowC",function() {
    $(this).parent().parent().remove(); 
    fnCalcularTotalCotizacion();
});

$(document).on("click", ".btnActualizarRow", function(){
    $("#mdlEditarProductos").modal("show");
    document.getElementById("codigoProducto").innerHTML = $(this).attr('dataCodigo');

    $('#txtModificarProducto').val($(this).attr('dataDescripcion'));
    $('#idProducto').val($(this).attr('dataCodigo'));   
    let idMovimiento = document.getElementById("u_movimientoID").value;
    $('#idModificacionProspecto').val(idMovimiento);
});

$(document).on("click", ".btnEditarProductos", function(){
    $("#mdlEditarProductos").modal("hide");
    document.getElementById("codigoProducto").innerHTML = $(this).attr('dataCodigo'); 
    ModificadoProducto = document.getElementById("txtModificarProducto").value;
    IdProductoSeleccionado = document.getElementById("idProducto").value;

    $("#tblCProductos tbody").find("tr").each(function(){
        const currentId = $(this).find(".clsIdProducto").val();

        if (currentId == IdProductoSeleccionado) {
            $(this).find(".clsDescripcionProducto").val(ModificadoProducto);
            $(this).find(".banderaDes").val("1");
        }
    });
});

$(document).on("click","#spEstimadoProductos",function() {
    try {
        var oportunidaid = $("#lblInfoOportunidad").text();
        var tabla="";
        var total=0;
        var totalacumulado=0;

        var fd = new FormData();
        
        fd.append("option","traeProductosEstimados");
        fd.append("oportunidadid",oportunidaid);

        var data = fnAjaxGeneral("", "POST", fd);
        
        $("#tblUsoGeneralDatos").empty();

        if(data.result){
            tabla= '<table class="table table-striped">';
            
            tabla+= "<thead>";
                tabla+= "<tr>";
                    tabla+= "<td class='titulos_principales'>Codigo</td>";
                    tabla+= "<td class='titulos_principales'>Descripcion</td>";
                    tabla+= "<td class='titulos_principales'>Cant</td>";
                    tabla+= "<td class='titulos_principales'>P.U.</td>";
                    tabla+= "<td class='titulos_principales'>Total</td>";
                tabla+= "</tr>";
            tabla+= "</thead>";

            if (data.contenido) {
                tabla+= "<tbody>";

                $.each(data.contenido, function(indice, registro) {
                    total= registro.cantidad*registro.precio;
                    totalacumulado+= total;

                    tabla+= "<tr>";
                        tabla+= "<td>"+registro.stockid+"</td>";
                        tabla+= "<td>"+registro.description+"</td>";
                        tabla+= "<td>"+registro.cantidad+"</td>";
                        tabla+= "<td nowrap>$ "+new Intl.NumberFormat().format(registro.precio)+"</td>";
                        tabla+= "<td nowrap>$ "+new Intl.NumberFormat().format(total)+"</td>";
                    tabla+= "</tr>";
                });

                tabla+= "</tbody>";
            }

            tabla+= "</table>";

            $("#lblUsoGeneralTitulo").text("Lista de Productos Estimados");
            $("#tblUsoGeneralDatos").append(tabla);
            $("#lblUsoGeneralTotalDatos").text(new Intl.NumberFormat().format(totalacumulado));

            $("#modalUsoGeneral").modal("show");

        } else {
            fnAlertaGeneral("Error", "Problemas al mostrar productos estimados...", "warning");
        }
    } catch (excepcion) {
        console.log("error en la ejecucion: "+excepcion);
    }
});

function fnDuplicaOportunidad(arrOportunidades){
    try{
        var seleccionados= JSON.stringify(arrOportunidades);
        var fd = new FormData();
        
        fd.append("option","DuplicarOportunidad");
        fd.append("oportunidades", seleccionados);

        var data = fnAjaxGeneral("", "POST", fd);
        
        if(data.result){
            fnAlertaGeneral("Exito", "Se duplico la oportunidad de manera correcta...", "success");
        } else {
            fnAlertaGeneral("Error", "Problemas al duplicar la oportunidad...", "warning");
        }
    } catch (excepcion) {
        console.log("error en la ejecucion: "+excepcion);
    }
}

function fnAgregarPartidas(){
    objProductosSeleccionados=[];

    $('#tblBusquedaProductos').find('.chkSelProductos:checked').each(
        function() {
            objProductosSeleccionados.push({
                stockid: $(this).data("idconcepto"),
                descripcion: $(this).data("nombre"),
                precio: $(this).data("precio"),
                unidad: $(this).data("unidad")
            });
        }
    );

    fnMostrarProductos(objProductosSeleccionados);
}

function fnMostrarProductos(objProductos){
    let area = $("#txtAreaTotal").val();
    let strBodyProductos="";
    let rowNext=$("#tblBProductos tbody").find("tr").length;

    $.each(objProductos, function(ind, row) {
        if (typeof(row.cantidad) != "undefined"){
            area = row.cantidad;
        }

        if(row.narrativeb){
            descripcion = row.narrativeb;
            bandera = "1";
        }else{
            descripcion = row.descripcion;
            bandera = "0";
        }

        strBodyProductos+="<tr>";
        strBodyProductos+="<td><button type='button' class='btn btn-xs btn-danger btnEliminarRow'><span class='glyphicon glyphicon-remove' aria-hidden='true'></span></button></td>";
        strBodyProductos+="<td nowrap style='text-align: center;'><input type='text' class='form-control input-sm clsIdProducto text-left' value='"+row.stockid+"' readonly/></td>";
        strBodyProductos+="<td><input type='text' class='form-control input-sm clsDescripcionProducto text-left' value='"+descripcion+"' readonly/></td>";
        strBodyProductos+="<td class='text-center'>"+row.unidad+"</td>";
        strBodyProductos+="<td class='text-right'>"+row.precio+"</td>";
        strBodyProductos+="<td><input type='hidden' class='clsProducto' value='"+row.stockid+"'/><input type='hidden' class='clsPrecio' value='"+row.precio+"'/><input type='text' class='form-control input-sm clsCantidadProducto pull-right text-right' value='"+area+"' data-precio='"+row.precio+"' onkeypress='return valideKey(event);' /></td>";
        strBodyProductos+="<td><input type='text' class='form-control input-sm clsTotalProducto pull-right text-right' id='totalProducto"+rowNext+"' readonly/></td>";
        strBodyProductos+="<td style='display: flex; justify-content: center;'><button type='button' class='btn btn-xs btn-primary btnActualizarRow' dataDescripcion='"+row.descripcion+"' dataUnidad='"+row.unidad+"' dataCodigo='"+row.stockid+"' ><span class='glyphicon glyphicon-pencil' aria-hidden='true'></span></button></td>";
        strBodyProductos+="<td class='hide'><input class='hide banderaDes' id='banderaDes'/></td>";
        strBodyProductos+="</tr>";
        rowNext++;
    });
    
    $("#tblBProductos tbody").append(strBodyProductos);

    fnCalcularValorEstimado();
}

function fnAgregarPartidasC(){
    objProductosSeleccionadosC=[];
    let area = $("#txtAreaTotal").val();
    $('#tblBusquedaProductos').find('.chkSelProductos:checked').each(
        function() {
            objProductosSeleccionadosC.push({
                stockid:$(this).data("idconcepto"),
                descripcion:$(this).data("nombre"),
                precio:$(this).data("precio"),
                cantidad:area,
                taxrate:$(this).data("taxrate")
            });
        }
    );
    fnMostrarProductosC(objProductosSeleccionadosC);
}

function fnMostrarProductosC(objProductos){
    let strBodyProductos="";
    let rowNext=$("#tblCProductos tbody").find("tr").length;
    $.each(objProductos, function(ind, row) {

        if(row.narrative){
            descripcion = row.narrative;
            bandera = "1";
        }else if(row.narrativeb){
            descripcion = row.narrativeb;
            bandera = "1";
        }else{
            descripcion = row.descripcion;
            bandera = "0";
        }
        
        strBodyProductos+="<tr>";
        strBodyProductos+="<td><button type='button' class='btn btn-xs btn-danger btnEliminarRowC'><span class='glyphicon glyphicon-remove' aria-hidden='true'></span></button></td>";
        strBodyProductos+="<td nowrap style='text-align: center;'><input type='text' class='form-control input-sm clsIdProducto text-left' value='"+row.stockid+"' readonly/></td>";
        strBodyProductos+="<td><input type='text' class='form-control input-sm clsDescripcionProducto text-left' value='"+descripcion+"' readonly/></td>";
        strBodyProductos+="<td><input type='text' class='form-control input-sm clsPrecioCNew text-right' value='"+row.precio+"' data-precio='"+row.precio+"'  data-stockid='"+row.stockid+"' onkeypress='return valideKey(event);' /></td>";
        strBodyProductos+="<td><input type='hidden' class='clsProductoC' value='"+row.stockid+"'/><input type='text' class='form-control input-sm clsCantidadProductoC text-right'  value='"+row.cantidad+"'  data-iva='"+row.taxrate+"' data-precio='"+row.precio+"' onkeypress='return valideKey(event);'/></td>";
        strBodyProductos+="<td><input type='hidden' class='form-control input-sm clsIVAC text-right' value='"+(parseFloat(row.taxrate)) +"' readonly/> "+parseFloat(row.taxrate) *100+"</td>";
        strBodyProductos+="<td><input type='text' class='form-control input-sm clsSubTotalProductoC text-right' id='SubtotalProductoC"+rowNext+"' readonly/><input type='hidden' class='form-control input-sm clsTotalProductoC text-right' id='totalProductoC"+rowNext+"' readonly/></td>";
        strBodyProductos+="<td style='display: flex; justify-content: center;'><button type='button' class='btn btn-xs btn-primary btnActualizarRow' dataDescripcion='"+descripcion+"' dataUnidad='"+row.unidad+"' dataCodigo='"+row.stockid+"' ><span class='glyphicon glyphicon-pencil' aria-hidden='true'></span></button></td>";
        strBodyProductos+="<td class='hide'><input class='hide banderaDes' id='banderaDes' value='"+bandera+"'/></td>";
        strBodyProductos+="</tr>";
        rowNext++;
    });
    
    $("#tblCProductos tbody").append(strBodyProductos);

    fnCalcularTotalCotizacion();
}


function fnModalBuscarProductos(filtro='', etapa="B"){
    var fd = new FormData();
    fd.append("option", "ModalBuscarProductos");
    fd.append("filtro", filtro);

    var data = fnAjaxGeneral("", "POST", fd);
    if(data.result){

        $('#tblBusquedaProductos').DataTable().clear();
        $('#tblBusquedaProductos').DataTable().draw();

        $.each(data.contenido, function(ind, row) {
            $('#tblBusquedaProductos').dataTable().fnAddData( 
                [
                    '<input type="checkbox" class="chkSelProductos" data-idconcepto="'+row.stockid+'" data-nombre="'+row.description+'" data-precio="'+row.price+'" data-taxrate="'+row.taxrate+'" data-unidad="'+row.units+'"/>',
                    '<a href="Stocks.php?&StockID='+row.stockid+'" target="_blank">'+row.stockid+'</a>',
                    row.description,
                    row.units
                ]
            );
        });

        $("#idEtapaBusqueda").val(etapa);
        $("#mdlBuscarProductos").modal("show");
    }else{
        fnAlertaGeneral("Error","Problemas al obtener los productos", "warning"); 
    }
}

function fnDocumentosAdmin(idOportunidad = 0){
    if(idOportunidad==0) return false;
    
    var encabezado= "<label>Documentos Generados</label>"
    var contenido= '<div class="" id="mdlDocAdministrativos" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" style="z-index: 2150;">'+
                        '<div class="panel panel-default">'+
                            '<div class="panel-header">'+

                                '<h4 class="modal-title" id="myModalLabel">Documentos Generados en la Oportunidad</h4>'+
                            '</div>'+
                            '<div class="panel-body">'+
                                '<div id="divDocumentos">'+
                                    '<div class="table-responsive ">'+
                                        '<table id="tblDocAdministrativos" class="table table-condensed table-hover table-striped">'+
                                            '<thead>'+
                                                '<tr>'+
                                                    '<th class="titulos_principales">#</th>'+
                                                    '<th class="titulos_principales">Folio</th>'+
                                                    '<th class="titulos_principales">Tipo</th>'+
                                                    '<th class="titulos_principales">Monto</th>'+
                                                    '<th class="titulos_principales">Fecha</th>'+
                                                    '<th class="titulos_principales">Usuario</th>'+
                                                '</tr>'+
                                            '</thead>'+
                                            '<tbody>'+
                                            '</tbody>'+
                                        '</table>'+
                                    '</div>'+
                                '</div>'+
                            '</div>'+
                            '<div class="modal-footer">'+
                                '<button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>'+
                            '</div>'+
                        '</div>'+
                    '</div>';

    fnMuestraBarraLateral(encabezado, contenido);

    var fd = new FormData();
    fd.append("option","ObtenerDocAdmin");
    fd.append("idOportunidad",idOportunidad);

    var data = fnAjaxGeneral("", "POST", fd);
    $("#tblDocAdministrativos tbody").empty();

    if(data.result){
        var strDocumentos="";

        if (data.contenido) {
            $.each(data.contenido[0].cotizaciones, function(ind, row) {
                strDocumentos+="<tr>";
                strDocumentos+="<td>"+(ind + 1)+"</td>";
                strDocumentos+="<td><a class='btn btn-primary btn-md' href='CotizacionProspecto.php?OrderNo="+row.orderno+"' target='_blank' role='button'>"+row.orderno+"</a></td>";
                strDocumentos+="<td>"+row.tipo+"</td>";
                strDocumentos+="<td>"+row.total+"</td>";
                strDocumentos+="<td>"+row.orddate+"</td>";
                strDocumentos+="<td>"+row.user+"</td>";
                strDocumentos+="</tr>";
            });
            $.each(data.contenido[0].timbres, function(ind, row) {
            });
        }

        $("#tblDocAdministrativos tbody").html(strDocumentos);

    }else{
        fnAlertaGeneral("Error","Error al obtener los documentos", "warning");
    }
}

function fnDocumentosAdminModal(idOportunidad = 0){
    if(idOportunidad==0) return false;
    
    var fd = new FormData();
    fd.append("option","ObtenerDocAdmin");
    fd.append("idOportunidad",idOportunidad);

    var data = fnAjaxGeneral("", "POST", fd);
    $("#tblDocAdministrativos234erfasdf tbody").empty();

    if(data.result){
        var strDocumentos="";

        if (data.contenido) {
            $.each(data.contenido[0].cotizaciones, function(ind, row) {
                strDocumentos+="<tr>";
                strDocumentos+="<td>"+(ind + 1)+"</td>";
                strDocumentos+="<td><a class='btn btn-primary btn-md' href='CotizacionProspecto.php?OrderNo="+row.orderno+"' target='_blank' role='button'>"+row.orderno+"</a></td>";
                strDocumentos+="<td>"+row.tipo+"</td>";
                strDocumentos+="<td>"+row.total+"</td>";
                strDocumentos+="<td>"+row.orddate+"</td>";
                strDocumentos+="<td>"+row.user+"</td>";
                strDocumentos+="</tr>";
            });
            $.each(data.contenido[0].timbres, function(ind, row) {
            });
        }

        $("#tblDocAdministrativos234erfasdf tbody").html(strDocumentos);
        $("#mdlDocAdministrativos234erfasdf").modal("show");

    }else{
        fnAlertaGeneral("Error","Error al obtener los documentos", "warning");
    }
}

function fnGuardarAdjuntos(sufijoid=''){
    if($("#fileEvidenciasModal"+sufijoid)[0].files.length==0){
        fnAlertaGeneral("Validación", "Es necesario seleccionar un archivo", "warning");
        return false;
    }

    // Validacion de categoria seleccionada
    var categoriaSel = $("#cmbCategoriaArchivo"+sufijoid).val();
    var categoriasPermitidas = ["documento","pago","imagen"];
    if (!categoriaSel || categoriasPermitidas.indexOf(categoriaSel) === -1){
        fnAlertaGeneral("Validación", "Selecciona una categoría antes de guardar (Documento, Pago o Imagen)", "warning");
        return false;
    }

    document.getElementById('fileEvidenciasModal'+sufijoid).value="";

    var fd = new FormData();

    fd.append("u_oportunidad", $("#u_oportunidad"+sufijoid).val());
    fd.append("categoria", categoriaSel);

    var arregloimagenes=[];
    let nombreimagen="", cadenaimagen="", tipoimagen="";

    for (var nada in $("#divImagenesConvertidas"+sufijoid)[0].childNodes) { 
        cadenaimagen= $("#divImagenesConvertidas"+sufijoid)[0].childNodes[nada].src;
        tipoimagen= $("#divImagenesConvertidas"+sufijoid)[0].childNodes[nada].alt;
        
        if (typeof(tipoimagen) != "undefined"){
            nombreimagen= uuid.v1()+"."+tipoimagen.split("/")[1];
        }

        if (typeof(cadenaimagen) == "string"){
            arregloimagenes.push({
                cadena: cadenaimagen,
                nombre: nombreimagen,
                tipo: tipoimagen
            });
        }
    }

    fd.append("imagenesconvertidas", JSON.stringify(arregloimagenes));
    fd.append("option","GuardarAdjuntos");

    var data = fnAjaxGeneral("", "POST", fd);

    if(data.result){
        fnAlertaGeneral("Correcto","Se guardo correctamente", "success");
        fnMostrarImagenOportunidad($("#u_oportunidad"+sufijoid).val(), sufijoid);
    }else{
        fnAlertaGeneral("Error","Problemas al guardar", "warning");
    }
}

function fnGuardarEtapaD(){
    var fd = new FormData();
    fd.append("option", "GuardarEtapaD");
    fd.append("u_movimiento", $("#u_movimientoID").val());
    fd.append("dtFechaCierre", $("#txtFechaCierreEstimada").val());
    fd.append("txtComentariosCierre", $("#txtComentariosCierre").val());
    var data = fnAjaxGeneral("", "POST", fd);
    if(data.result){
        fnAlertaGeneral("Correcto","Se guardo correctamente la etapa D", "success");
        fnGuardarActividadGenereal($("#txtFechaCierreEstimada").val(),"Fecha de Cierre Estimada", $("#txtComentariosCierre").val(), $("#u_movimientoID").val());
    }else{
        fnAlertaGeneral("Error","Problemas al guardar etapa D", "warning");
    }

}

function fnCalcularPuntosTiempoVida(){
    let valBaches = $('input[name="rdTiempoVida1"]:checked').data('valortv');
    let valAgre = $('input[name="rdTiempoVida2"]:checked').data('valortv');
    let valCorru = $('input[name="rdTiempoVida3"]:checked').data('valortv');
    let valParche = $('input[name="rdTiempoVida4"]:checked').data('valortv');
    let valAcocodri = $('input[name="rdTiempoVida5"]:checked').data('valortv');
    let valDesg = $('input[name="rdTiempoVida6"]:checked').data('valortv');
    let valDepr = $('input[name="rdTiempoVida7"]:checked').data('valortv');

    valBaches = (typeof valBaches === 'undefined'? 0: valBaches);
    valAgre = (typeof valAgre === 'undefined'? 0: valAgre);
    valCorru = (typeof valCorru === 'undefined'? 0: valCorru);
    valParche = (typeof valParche === 'undefined'? 0: valParche);
    valAcocodri = (typeof valAcocodri === 'undefined'? 0: valAcocodri);
    valDesg = (typeof valDesg === 'undefined'? 0: valDesg);
    valDepr = (typeof valDepr === 'undefined'? 0: valDepr);
        

    let sumaTiempoVida = parseFloat(valBaches) + parseFloat(valAgre)+ parseFloat(valCorru)+ parseFloat(valParche) +parseFloat(valAcocodri) + parseFloat(valDesg)+parseFloat(valDepr);
    $("#txtPuntosTV").val(sumaTiempoVida.toFixed(2));
    
    fnVisualizarAlertaCriterio(sumaTiempoVida);
}

function fnVisualizarAlertaCriterio(sumaTiempoVida=0){
    //console.log(sumaTiempoVida);
    var msjCriterio="";
    var alrtTipo="";
    var desTiempoVida="";
    var mesesTiempoVida="";
    if(sumaTiempoVida <=19){
        mesesTiempoVida="1";
        desTiempoVida="1 Mes";
        alrtTipo="alert-danger";
        msjCriterio="<strong>Pesimo! </strong>La carperta se encuentra en pesimas condiciones.";
    }else if(sumaTiempoVida > 19 && sumaTiempoVida<=39){
        mesesTiempoVida="3";
        desTiempoVida="3 Meses";
        alrtTipo="alert-warning";
        msjCriterio="<strong>Malo! </strong>La carpeta se encuentra en malas condiciones con muchos daños.";
    }else if(sumaTiempoVida > 39 && sumaTiempoVida<=59){
        mesesTiempoVida="6";
        desTiempoVida="6 Meses";
        alrtTipo="alert-default";
        msjCriterio="<strong>Regular! </strong>La carpeta empieza a presentar daños considerados.";
    }else if(sumaTiempoVida >59 && sumaTiempoVida<=79){
        mesesTiempoVida="12";
        desTiempoVida="12 Meses";
        alrtTipo="alert-info";
        msjCriterio="<strong>Bueno! </strong>Es una carpeta que se encuentra en buen estado, sin embargo empieza a presentar pequeños daños en la superficie como baches, grietas, desgranado.";
    }else if(sumaTiempoVida >= 79){
        mesesTiempoVida="18";
        desTiempoVida="18 Meses";
        alrtTipo="alert-success";
        msjCriterio="<strong>Excelente! </strong>Las condiciones de la carpeta son excelentes, no presenta ningun daño y es practicamente nueva o acaban de realizar mantenimiento.";
    }

    if(sumaTiempoVida==0){
        $("#divAlertaCriterio").addClass("hide");
        $("#msjResultadoCriterio").text(""); 
        $("#txtDesPuntosTV").val(""); 
        $("#txtMesesPuntosTV").val("0"); 
    }else{
        $("#divAlertaCriterio").removeClass('hide alert-danger alert-warning alert-info alert-success');
        $("#divAlertaCriterio").addClass(alrtTipo);
        $("#msjResultadoCriterio").empty(); 
        $("#msjResultadoCriterio").text(""); 
        $("#msjResultadoCriterio").html(msjCriterio); 
        $("#txtDesPuntosTV").val(desTiempoVida); 
        $("#txtMesesPuntosTV").val(mesesTiempoVida); 
    }
}

function fnValidarCamposEtapaA(){
    let blnProceso = true;
    let mensaje= "Existen campos obligatorios vacios";

    $("#formProspecto select").removeClass('error');
    $("#formProspecto input[type=text] , #formProspecto textarea").removeClass('error');

    if($("#aPaterno").val() == ""){
        $("#aPaterno").addClass('error');
        blnProceso = false;
    }
    
    if($("#SectComClId").val() == ""){
        $("#SectComClId").addClass('error');
        blnProceso = false;
    }
    
    if($("#estado_pros").val() == ""){
        $("#estado_pros").addClass('error');
        blnProceso = false;
    }
    
    if($("#CustLeadSourceId").val() == ""){
        $("#CustLeadSourceId").addClass('error');
        blnProceso = false;
    }

    if ($("#txtLinkMapa_pros").val() == ""){
        $("#txtLinkMapa_pros").addClass("error");
        blnProceso = false;
    }

    const formatocorrecto = (coordenadas) => {
        if (coordenadas.match(/^[-]?\d+[\.]?\d*, [-]?\d+[\.]?\d*$/)) {
            return true;
        }
        return false;
    }

    if(!formatocorrecto($("#txtLinkMapa_pros").val())){
        $("#txtLinkMapa_pros").addClass("error");
        mensaje="Formato de coordenadas incorrecto, debe tener latitud y longitud separado por coma. (ej. 20.563740,-100.412781)";
        blnProceso = false;
    }

    if(!blnProceso){
        fnAlertaGeneral("Validacion", mensaje, "warning");
    }
    
    return blnProceso;
}

function fnLimpiarModalProspecto(){
    $("#formProspecto select").each(function() { this.selectedIndex = 0 });
    $("#formProspecto select").multiselect('rebuild');
    $("#formProspecto input[type=text] , #formProspecto textarea").each(function() { this.value = '' });

    $("#lblProspectoId_Existente").text("");
    $("#u_movimientoID").val("");
    $("#idOportunidad").val("");
    $("#idProspecto").val("");
    $("#idContacto").val("");
    $("#txtIdOrderNo").val("");  

    $('.liEtapas').removeClass('active');
    $('.tab-pane').removeClass('active');

    $("#liEtapaA").addClass('active');
    $("#divEtapaA").addClass('checked');
    $("#etapaa").addClass('active');

    $("#divCCotizacion").addClass("hide");
    $("#divCCotizar").removeClass("hide");

    blnCargarCicloTiempoVida=true;
    blnModificarCotizacion= false;

    if (etapaAImagenUploader) {
        etapaAImagenUploader.reset();
    }
}

function fnAgendarCita(idOportunidad){
    $("#u_movimiento").val(idOportunidad);
    $('#mdlAgendarCita').modal("show");
}

function fnEtapaB(idOportunidad){
    var fd = new FormData();
    fnLimpiarModalProspecto();
    fd.append("option", "ObtenerOportunidad");
    fd.append("u_movimiento", idOportunidad);
    var data = fnAjaxGeneral("", "POST", fd);
    var idEstatus = 0;
    var idVendedor = 0;
    var prospecto= "";
    if(data.result){
        if (data.contenido) {
            //console.log(data.contenido);
            $("#idOportunidad").val(idOportunidad);
            $("#u_movimientoID").val(idOportunidad);

            $.each(data.contenido, function(ind, row) {
                $("#lblProspectoId_Existente").text(row.debtorno);
                idEstatus = row.idstatus;
                idVendedor = row.salesman;
                prospecto= row.prospecto;
                fnRenderWizard(row.idstatus, data.contenido);
            });
        }
    }

    if(idEstatus == 0){
        $("#cmbVendedorVisita").val(idVendedor);
        $("#cmbVendedorVisita").multiselect('rebuild');
        //fnAgendarCita(idOportunidad);
        fnAbrilModalActividadesNuevo(idOportunidad, prospecto, '', '');
    }else{
        $('#myModal').modal("show");
    }
}

function fnAbrilModalActividadesNuevo(oportunidad){
    $("#contenedornotificaciones").empty();
    $("#contenedornotificaciones").append('Cargando datos...');
    openNav();
    fnTraeInfoProspecto(oportunidad);
    $("#contenedornotificaciones").empty();
    $("#contenedornotificaciones").append($("#divContenedorProspecto")[0].innerHTML);
}

function fnMostrarDatosProspectoModal(idOportunidad){
    var idEstatus = 0;
    var idVendedor = 0;
    var prospecto= "";

    var fd = new FormData();
    
    fd.append("option", "ObtenerOportunidad");
    fd.append("u_movimiento", idOportunidad);
    
    var data = fnAjaxGeneral("", "POST", fd);
    
    fnLimpiarModalProspecto();

    if(data.result){
        if (data.contenido) {
            //console.log(data.contenido);
            $("#idOportunidad").val(idOportunidad);
            $("#u_movimientoID").val(idOportunidad);

            $.each(data.contenido, function(ind, row) {
                idEstatus = row.idstatus;
                idVendedor = row.salesman;
                prospecto= row.prospecto;
                
                fnCargarEtapaA(data.contenido);
            });
        }
    }
}

function fnRenderWizard(idEstatus, data){
    idEstatusActual = parseInt(idEstatus, 10);
    $('.liEtapas').removeClass('active');
    $('.tab-pane').removeClass('active');
    blnModificarCotizacion = false;
    blnCargarCicloTiempoVida = true;

    objProductosSeleccionados=[];
    objProductosSeleccionadosC=[];

    $("#btnModCotizacion").removeClass("hide");
    
    if($("#idBotonAut").val()=="1"){
        $("#btnAutorizarCotizacion").removeClass("hide");
    } else {
        $("#btnAutorizarCotizacion").addClass("hide");
    }

    switch (idEstatus) {
        case "0":
            $("#liEtapaA").addClass('active');
            $("#divEtapaA").addClass('checked');
            $("#etapaa").addClass('active');
            break;
        case "1":
            //$("#liEtapaA").addClass('active');
            //$("#divEtapaA").addClass('checked');
            //$("#etapaa").addClass('active');
            $("#liEtapaB").addClass('active');
            $("#divEtapaB").addClass('checked');
            $("#etapab").addClass('active');
            $("#b_informacion").addClass('active');
            fnCargarEtapaA(data);
            //fnObtenerProductos();
            break;
        case "2":
            //$("#liEtapaB").addClass('active');
            //$("#divEtapaB").addClass('checked');
            //$("#etapab").addClass('active');
            //$("#b_informacion").addClass('active');
            //fnCargarEtapaA(data);
            //fnObtenerProductos();
                $("#liEtapaC").addClass('active');
                $("#divEtapaC").addClass('checked');
                $("#etapac").addClass('active');
                $("#b_informacion").addClass('active');
                fnCargarEtapaA(data);
                fnCargarEtapaB(data);
                fnBloquearEtapaB();
		break;
        case "3":
                /*$("#liEtapaC").addClass('active');
                $("#divEtapaC").addClass('checked');
                $("#etapac").addClass('active');
                $("#b_informacion").addClass('active');
                fnCargarEtapaA(data);
                fnCargarEtapaB(data);
                fnCargarEtapaC(data[0].cotizaciones);*/
                $("#liEtapaC").addClass('active');
                $("#divEtapaC").addClass('checked');
                $("#etapac").addClass('active');
                $("#b_informacion").addClass('active');
                fnCargarEtapaA(data);
                fnCargarEtapaB(data);
		fnBloquearEtapaB();
                fnCargarEtapaC(data);

                document.getElementById('asdfq34tsdfgq4tgwrtb').removeAttribute('href');
                document.getElementById('asdfq34tsdfgq4tgwrtb').href='#etapad';

                break;
        case "4":
                /*$("#liEtapaD").addClass('active');
                $("#divEtapaD").addClass('checked');
                $("#etapad").addClass('active');
                $("#b_informacion").addClass('active');
                fnCargarEtapaA(data);
                fnCargarEtapaB(data);

                fnCargarEtapaC(data[0].cotizaciones);*/
                $("#liEtapaD").addClass('active');
                $("#divEtapaD").addClass('checked');
                $("#etapad").addClass('active');
                document.getElementById('asdfq34tsdfgq4tgwrtb').href='#etapad';
                $("#b_informacion").addClass('active');
                fnCargarEtapaA(data);
                fnCargarEtapaB(data);
                fnCargarEtapaC(data);
                $("#btnSolCotizacion").addClass("hide");
                $("#btnAutorizarCotizacion").addClass("hide");
                //$("#btnModCotizacion").addClass("hide");
                break;
        case "5":
                /*$("#liEtapaD").addClass('active');
                $("#divEtapaD").addClass('checked');
                $("#etapad").addClass('active');
                $("#b_informacion").addClass('active');
                fnCargarEtapaA(data);
                fnCargarEtapaB(data);

                fnCargarEtapaC(data[0].cotizaciones);*/
                $("#liEtapaD").addClass('active');
                $("#divEtapaD").addClass('checked');
                $("#etapad").addClass('active');
                document.getElementById('asdfq34tsdfgq4tgwrtb').href='#etapad';
                $("#b_informacion").addClass('active');
                fnCargarEtapaA(data);
                fnCargarEtapaB(data);
		fnBloquearEtapaB();
                fnCargarEtapaC(data);
                $("#btnModCotizacion").addClass("hide");
                $("#btnSolCotizacion").addClass("hide");
                $("#btnAutorizarCotizacion").addClass("hide");
                //$("#btnModCotizacion").addClass("hide");

                break;
            case "6":
                    $("#liEtapaD").addClass('active');
                    $("#divEtapaD").addClass('checked');
                    $("#etapad").addClass('active');
                    document.getElementById('asdfq34tsdfgq4tgwrtb').href='#etapad';
                    $("#b_informacion").addClass('active');
                    fnCargarEtapaA(data);
                    fnCargarEtapaB(data);
		    fnBloquearEtapaB();
                    fnCargarEtapaC(data);
                    $("#btnModCotizacion").addClass("hide");
                    $("#btnSolCotizacion").addClass("hide");
                    $("#btnAutorizarCotizacion").addClass("hide");
    
                    break;
        default:
            break;
    }

    fnBloquearEtapaB();

    $("#formProspecto select").multiselect('rebuild');
}

function fnCargarEtapaA(data){
    $.each(data, function(ind, row) {
        $("#spProspectoExistente").removeClass("hide");
        $("#lblProspectoId_Existente").text(row.debtorno);
        $("#idProspecto").val(row.debtorno);
        $("#aPaterno").val(row.prospecto);
        $("#aPaterno_alterno").val(row.referencia);
        $("#email_pros").val(row.email);
        $("#SectComClId").val(row.SectComClId);
        $("#estado_pros").val(row.estado);
        $("#telefonoFijo_pros").val(row.telefono_fijo);
        $("#ciudad_pros").val(row.ciudad);
        $("#cmbVendedor").val(row.salesman);
        $("#contactsmensid").val(row.medio_contacto);
        $("#CustLeadSourceId").val(row.fuente_contacto);
        $("#txtIdContacto").val(row.id_contacto);
        $("#conName").val(row.nombre_contacto);
        $("#conRole").val(row.puesto_contacto);
        $("#telefonofijo_conta").val(row.puesto_contacto);
        $("#telefonocel_conta").val(row.movil_contacto);
        $("#emailC_contac").val(row.email_contacto);
        $("#idContacto").val(row.id_contacto);
        $("#txtComentarios").val(row.cometarios);

        $("#cp_pros").val(row.cp);
        $("#colonia_pros").val(row.colonia);
        $("#direccion_pros").val(row.direccion);
        $("#txtLinkMapa_pros").val(row.link_google_map);

        $("#txtCorreoEncargado").val(row.email);
        $("#txtTelefonoEncargado").val(row.telefono_fijo);
        $("#cmbVendedorMulti").val(row.coagente);
    });

    if (etapaAImagenUploader && $("#idOportunidad").val() != "") {
        etapaAImagenUploader.loadSavedImages($("#idOportunidad").val());
    }
}

function fnCargarEtapaB(data){
    $.each(data, function(ind, row) {
        $("#txtNecesidadesCliente").val(row.descripcion);
        $("#txtNombreEncargado").val(row.encargado_proyecto);
        $("#txtTelefonoEncargado").val(row.telefono_encargado);
        $("#txtNombreEncargado2").val(row.encargado_proyecto);
        $("#txtTelefonoEncargado2").val(row.telefono_encargado);
        $("#txtCorreoEncargado").val(row.correo_encargado);
        $("#txtKmPlanta").val(row.km_planta);
        $("#txtAreaTotal").val(row.area_total);
        $("#txtKmPlanta2").val(row.km_planta);

        $("#txtAreaTotal2").val(row.area_total);
        $("#txtTiempoDedicado").val(row.tiempo_dedicado);
        $("#txtComentarios").val(row.cometarios);
        $("#txtComentarios2").val(row.cometarios);
        $("#txtValorEstimado").val(row.cargo);
    });

    //fnObtenerProductos();
    $("#tblBProductos tbody").empty();
    $("#tblCProductos tbody").empty();
    fnCargarProductosSeleccionados(data);

    fnMostrarCheckTiempoVida();
    $.each(data[0].tiempovida, function(ind, row) {
        $('input[name="rdTiempoVida'+row.idConcepto+'"][data-idsuperficie="'+row.idSuperficie+'"]').prop("checked", true);
    });
    fnCalcularPuntosTiempoVida();

    $.each(data[0].pdftemplates, function(ind, row) {
        $("#txtCondicionesComerciales").val(row.consulta);
    });
    $.each(data[0].cotizaciones, function(ind, row) {
        $("#txtIdOrderNo").val(row.orderno);
    });

    /* Etapa B sin adjuntos */
}

function fnBloquearEtapaB(){
    // Deshabilitar botones eliminar y editar de productos en Etapa B
    $("#tblBProductos").find(".btnEliminarRow").addClass("hide");
    $("#tblBProductos").find(".btnActualizarRow").addClass("hide");
    // Deshabilitar cantidad editable
    $("#tblBProductos").find(".clsCantidadProducto").prop("readonly", true).css("background-color","#eeeeee");
    if (idEstatusActual >= 2) {
        // Prospecto ya paso de etapa B: bloquear datos de negocio pero permitir editar datos de contacto
        $("#txtAreaTotal").prop("readonly", true).css("background-color","#eeeeee");
        $("#txtTiempoDedicado").prop("readonly", true).css("background-color","#eeeeee");
        $("#txtKmPlanta").prop("readonly", true).css("background-color","#eeeeee");
        $("#txtPuntosTV").prop("readonly", true).css("background-color","#eeeeee");
        // Bloquear radios de tiempo de vida
        $("input[name^='rdTiempoVida']").prop("disabled", true);
        // Bloquear modal de productos y avance de etapa
        $("#b_productos .mdlSelProductoB").prop("disabled", true).addClass("disabled");
        $("#btnSiguienteEtapaB").prop("disabled", true).addClass("disabled");
        // Permitir guardar cambios de datos de contacto
        $("#btnGuardarEtapaB").prop("disabled", false).removeClass("disabled").val("Guardar datos de contacto");
    }
}


function fnCargarEtapaC(data){

    $("#btnSolCotizacion").removeClass("hide");
    $.each(data, function(ind, row) {
        if(row.idpropiedad==1){
            $("#btnSolCotizacion").addClass("hide");
        }
    });
    
    $.each(data[0].cotizaciones, function(ind, row) {
        if(row.orderno!=""){
            $("#linkVerCotizacion").attr("href", "CotizacionProspecto.php?OrderNo="+row.orderno);
            $("#divCCotizacion").removeClass("hide");
            $("#divCCotizar").addClass("hide");
        }
        $("#cmbUnidadesNegocio").val(row.tagref);
    });
}

function fnInsertarEtapaA(){
    if (etapaAImagenUploader && etapaAImagenUploader.isProcessing) {
        fnAlertaGeneral("Imágenes", "Espera a que termine el procesamiento de imágenes antes de guardar.", "info");
        return false;
    }

    $("#btnSiguienteEtapaA").button('loading');
    var fd = new FormData(document.getElementById("formProspecto"));

    if($("#idOportunidad").val()!=""){
        fd.append("option","modificarEtapaA");
    }else{
        var debProspect = $("#lblProspectoId_Existente").val();
        fd.append("lblProspectoId_Existente", debProspect);
        fd.append("option","insertarEtapaA");
    }

    var rsProceso= false;
    $.ajax({
        async:false,
        url:"modelo/ProspectV2Modelo.php",
        type:'POST',
        data: fd, 
        cache: false,
        contentType: false,
        processData: false,
        dataType: 'json',
        success: function (data) {
            if (data.contenido) {
                rsProceso = true ;
            }
            if(data.result){
                var resultadoImagenesEtapaA = {
                    result: true,
                    skipped: true
                };

                if (etapaAImagenUploader) {
                    resultadoImagenesEtapaA = etapaAImagenUploader.uploadPending(data.result);
                }

                if (resultadoImagenesEtapaA && resultadoImagenesEtapaA.result === false) {
                    fnAlertaGeneral("Atención","La etapa A se guardó, pero hubo un problema al subir las imágenes.", "warning");
                } else if (etapaAImagenUploader && etapaAImagenUploader.hasPendingImages() === false && resultadoImagenesEtapaA.skipped !== true) {
                    fnAlertaGeneral("Correcto","Se guardó correctamente la etapa A y las imágenes del prospecto.", "success");
                } else {
                    fnAlertaGeneral("Correcto","Se guardo correctamente en base de datos", "success");
                }
                fnEtapaBfast(data.result);
                actualizarEstatusProspec(1, data.result);
                mostrarProspectoMapa(data.result);
            }else{
                fnAlertaGeneral("Error","Problemas al guardar etapa A", "warning");
            }
            $("#btnSiguienteEtapaA").button('reset');

        },
        error:function(datos){
            //console.log(datos);
        }
        
    });
    return rsProceso;
}

function fnEtapaBfast(idOportunidad){
    var fd = new FormData();
    
    fd.append("option", "ObtenerOportunidad");
    fd.append("u_movimiento", idOportunidad);
    var data = fnAjaxGeneral("", "POST", fd);

    if(data.result){
        if (data.contenido) {
            $("#idOportunidad").val(idOportunidad);
            $("#u_movimientoID").val(idOportunidad);

            $.each(data.contenido, function(ind, row) {
                $("#lblProspectoId_Existente").text(row.debtorno);
                idEstatus = row.idstatus;
                idVendedor = row.salesman;
                prospecto= row.prospecto;
                fnRenderWizard('1', data.contenido);
            });
        }
    }

    $('#myModal').modal("show");
}

function fnGuardarEtapaB(soloGuardar=false){
    try {
        if(!fnValidarCamposEtapaB()){return false;}

        $("#btnSiguienteEtapaB").button('loading');

        var fd = new FormData(document.getElementById("formProspecto"));
        
        fd.append("option","GuardarEtapaB");
        fd.append("soloGuardar",soloGuardar);
        fd.append("imagenesconvertidas", "[]");

        var productos_estapab = new Object();
        var tiempo_vida_estapab = new Object();

        let contador=0;
        $("#tblBProductos tbody").find("tr").each(function(){
            if($(this).find(".clsCantidadProducto ").val()!=""){
                productos_estapab[contador] = new Object();
                productos_estapab[contador].stockid = $(this).find(".clsProducto").val();
                productos_estapab[contador].precio = $(this).find(".clsPrecio").val();
                productos_estapab[contador].cantidad = $(this).find(".clsCantidadProducto ").val();
                contador++;
            }
        });
        
        tiempo_vida_estapab[0] = new Object(); 
        tiempo_vida_estapab[0].idconcepto = $('input[name="rdTiempoVida1"]:checked').data('idconcepto');
        tiempo_vida_estapab[0].idsuperficie = $('input[name="rdTiempoVida1"]:checked').data('idsuperficie');
        tiempo_vida_estapab[0].puntos = $('input[name="rdTiempoVida1"]:checked').data('valortv');

        tiempo_vida_estapab[1] = new Object(); 
        tiempo_vida_estapab[1].idconcepto = $('input[name="rdTiempoVida2"]:checked').data('idconcepto');
        tiempo_vida_estapab[1].idsuperficie = $('input[name="rdTiempoVida2"]:checked').data('idsuperficie');
        tiempo_vida_estapab[1].puntos = $('input[name="rdTiempoVida2"]:checked').data('valortv');

        tiempo_vida_estapab[2] = new Object(); 
        tiempo_vida_estapab[2].idconcepto = $('input[name="rdTiempoVida3"]:checked').data('idconcepto');
        tiempo_vida_estapab[2].idsuperficie = $('input[name="rdTiempoVida3"]:checked').data('idsuperficie');
        tiempo_vida_estapab[2].puntos = $('input[name="rdTiempoVida3"]:checked').data('valortv');

        tiempo_vida_estapab[3] = new Object(); 
        tiempo_vida_estapab[3].idconcepto = $('input[name="rdTiempoVida4"]:checked').data('idconcepto');
        tiempo_vida_estapab[3].idsuperficie = $('input[name="rdTiempoVida4"]:checked').data('idsuperficie');
        tiempo_vida_estapab[3].puntos = $('input[name="rdTiempoVida4"]:checked').data('valortv');

        tiempo_vida_estapab[4] = new Object(); 
        tiempo_vida_estapab[4].idconcepto = $('input[name="rdTiempoVida5"]:checked').data('idconcepto');
        tiempo_vida_estapab[4].idsuperficie = $('input[name="rdTiempoVida5"]:checked').data('idsuperficie');
        tiempo_vida_estapab[4].puntos = $('input[name="rdTiempoVida5"]:checked').data('valortv');

        tiempo_vida_estapab[5] = new Object(); 
        tiempo_vida_estapab[5].idconcepto = $('input[name="rdTiempoVida6"]:checked').data('idconcepto');
        tiempo_vida_estapab[5].idsuperficie = $('input[name="rdTiempoVida6"]:checked').data('idsuperficie');
        tiempo_vida_estapab[5].puntos = $('input[name="rdTiempoVida6"]:checked').data('valortv');

        tiempo_vida_estapab[6] = new Object(); 
        tiempo_vida_estapab[6].idconcepto = $('input[name="rdTiempoVida7"]:checked').data('idconcepto');
        tiempo_vida_estapab[6].idsuperficie = $('input[name="rdTiempoVida7"]:checked').data('idsuperficie');
        tiempo_vida_estapab[6].puntos = $('input[name="rdTiempoVida7"]:checked').data('valortv');

        fd.append("productos",JSON.stringify(productos_estapab));
        fd.append("tiempovida",JSON.stringify(tiempo_vida_estapab));
        //console.log(tiempo_vida_estapab);

        var data = fnAjaxGeneral("", "POST", fd);

        if(data.result){
            fnAlertaGeneral("Correcto","Se guardo correctamente la etapa B", "success");
            //fnGuardarActividadGenereal("","Registro de la etapa B.", "Registro de la etapa B.", $("#u_movimientoID").val());
            $("#btnSiguienteEtapaB").button('reset');
            // Si es solo guardar y el prospecto ya paso de etapa B, no forzar traerRegistroB
            // (traerRegistroB llama a actualizarEstatusProspec(2) que pisaria la etapa actual)
            if (soloGuardar && idEstatusActual >= 2) {
                // Solo refrescar datos visuales del mapa sin tocar el estatus
                mostrarProspectoMapa($("#idOportunidad").val());
            } else {
                traerRegistroB(1, $("#idOportunidad").val());
            }
        }else{
            $("#btnSiguienteEtapaB").button('reset');
            fnAlertaGeneral("Error","Problemas al guardar etapa B", "warning");
        }

    } catch (excepcion) {
        console.log("excepcion: "+excepcion);
    }
}

function traerRegistroB(Etapa, idOportunidad){
    var oportunidadActual = idOportunidad || $("#idOportunidad").val();
    var fd = new FormData();
    fd.append("option", "traerRegistroBase");
    var data = fnAjaxGeneral("", "POST", fd);
    if(Etapa == 1){
        fnEtapaCfast(oportunidadActual);
        actualizarEstatusProspec(2, oportunidadActual);
        mostrarProspectoMapa(oportunidadActual);
    } else if(Etapa == 2){
        actualizarEstatusProspec(3, oportunidadActual);
        mostrarProspectoMapa(oportunidadActual);
    }else {
        console.log("Sin etapa");
    }
}

function fnEtapaCfast(idOportunidad){
    var fd = new FormData();

    fd.append("option", "ObtenerOportunidad");
    fd.append("u_movimiento", idOportunidad);
    var data = fnAjaxGeneral("", "POST", fd);
    
    if(data.result){
        if (data.contenido) {
            $("#idOportunidad").val(idOportunidad);
            $("#u_movimientoID").val(idOportunidad);

            $.each(data.contenido, function(ind, row) {
                $("#lblProspectoId_Existente").text(row.debtorno);
                idEstatus = row.idstatus;
                idVendedor = row.salesman;
                prospecto= row.prospecto;
                fnRenderWizard('2', data.contenido);
            });
        }
    }

    $('#myModal').modal("show");
}


function fnAutorizarEtapaB(){
    var fd = new FormData(document.getElementById("frmAutorizarB"));
    fd.append("option", "AutorizarEtapaB");
    var data = fnAjaxGeneral("", "POST", fd);
    if(data.result){
        fnAlertaGeneral("Correcto","Se autorizo correctamente la etapa A", "success");
    }else{
        fnAlertaGeneral("Error","Problemas al autorizar etapa A", "warning");
    }
    $("#mdlAgendarCita").modal("hide");
}

function fnAutorizarCotizacion(){
    var fd = new FormData();
    fd.append("option", "AutorizarCotizacion");
    fd.append("u_movimiento", $("#idOportunidad").val());
    var data = fnAjaxGeneral("", "POST", fd);
    if(data.result){
        fnAlertaGeneral("Correcto","Se autorizo la cotización", "success");
        $('.liEtapas').removeClass('active');
        $('.tab-pane').removeClass('active');
        $("#liEtapaD").addClass('active');
        $("#divEtapaD").addClass('checked');
        $("#etapad").addClass('active');
        $("#b_informacion").addClass('active');
        
        document.getElementById('asdfq34tsdfgq4tgwrtb').href='#etapad'
    }else{
        fnAlertaGeneral("Error","Problemas al autorizarla cotizacion", "warning");
    }
    $("#mdlAgendarCita").modal("hide");
}

function fnSolicitarAutorizarCotizacion(){
    var fd = new FormData();
    fd.append("option", "SolicitarAutorizarCotizacion");
    fd.append("u_movimiento", $("#idOportunidad").val());
    var data = fnAjaxGeneral("", "POST", fd);
    if(data.result){
        fnAlertaGeneral("Correcto","Se solicita autorización de la cotización", "success");
    }else{
        fnAlertaGeneral("Error","Problemas al autorizarla cotizacion", "warning");
    }

    fnGuardarNotificacionGeneral("Cotización Pendiente por Autorizar con el numero de Oportunidad: "+$("#idOportunidad").val()+ 'Prospecto: '+$("#aPaterno").val(), 'paneldecontrolprospectos.php?umovimiento='+$("#idOportunidad").val(), 1, "scenteno", $("#idOportunidad").val());

}

function fnAjaxGeneral(strURL, strTipo, fdDatos){
    strURL = "modelo/ProspectV2Modelo.php";

    var datos="";
    $.ajax({
        async:false,
        url: strURL,
        type:strTipo,
        data: fdDatos, 
        cache: false,
        contentType: false,
        processData: false,
        dataType: 'json',
        beforeSend: function() {},
        complete: function() {},
        success: function (data) {
            datos = data;
        },
        error:function(datos){
            
        }
        
    });
    return datos;

}

function fnObtenerProductos(){
    return false;
    var fd = new FormData();
    fd.append("option","ObtenerProductos");
    var data = fnAjaxGeneral("", "POST", fd);
    $("#tblBProductos tbody").empty();
    if(data.result){
        var strBodyProductos="";
        $.each(data.contenido, function(ind, row) {
            strBodyProductos+="<tr>";
            strBodyProductos+="<td>"+row.stockid+"</td>";
            strBodyProductos+="<td>"+row.description+"</td>";
            strBodyProductos+="<td class='text-right'>"+row.price+"</td>";
            strBodyProductos+="<td><input type='hidden' class='clsProducto' value='"+row.stockid+"'/><input type='hidden' class='clsPrecio' value='"+row.price+"'/><input type='text' class='form-control input-sm clsCantidadProducto text-right ' data-precio='"+row.price+"' onkeypress='return valideKey(event);' /></td>";
            strBodyProductos+="<td><input type='text' class='form-control input-sm clsTotalProducto text-right' id='totalProducto"+ind+"' readonly/></td>";
            strBodyProductos+="</tr>";
        });
        
        $("#tblBProductos tbody").html(strBodyProductos);
        fnProductosEtapaC(data.contenido);
    }
}

function fnProductosEtapaC(data){
    var strBodyProductos="";

    $("#tblCProductos tbody").empty();
    $.each(data, function(ind, row) {
        strBodyProductos+="<tr>";
        strBodyProductos+="<td>"+row.stockid+"</td>";
        strBodyProductos+="<td>"+row.description+"</td>";
        strBodyProductos+="<td><input type='text' class='form-control input-sm clsPrecioCNew text-right' value='"+row.price+"' data-precio='"+row.price+"'  data-stockid='"+row.stockid+"' onkeypress='return valideKey(event);' /></td>";
        strBodyProductos+="<td><input type='hidden' class='clsProductoC' value='"+row.stockid+"'/><input type='text' class='form-control input-sm clsCantidadProductoC text-right' data-iva='"+row.taxrate+"' data-precio='"+row.price+"' onkeypress='return valideKey(event);'/></td>";
        strBodyProductos+="<td><input type='hidden' class='form-control input-sm clsIVAC text-right' value='"+(parseFloat(row.taxrate)) +"' readonly/> "+parseFloat(row.taxrate) *100+"</td>";
        strBodyProductos+="<td><input type='text' class='form-control input-sm clsSubTotalProductoC text-right' id='SubtotalProductoC"+ind+"' readonly/><input type='hidden' class='form-control input-sm clsTotalProductoC text-right' id='totalProductoC"+ind+"' readonly/></td>";
        strBodyProductos+="</tr>";
    });
    
    $("#tblCProductos tbody").html(strBodyProductos);
}

function fnCargarProductosSeleccionados(data){
    objProductosSeleccionados=[];

    $.each(data[0].productos, function(ind, row) {
        objProductosSeleccionados.push({
            stockid:row.stockid,
            descripcion:row.description,
            precio:row.precio,
            cantidad:row.cantidad,
            unidad: row.units,
            narrativeb: row.narrativeb
        });
    });

    fnMostrarProductos(objProductosSeleccionados);

    objProductosSeleccionadosC=[];

    $.each(data[0].productosC, function(ind, row) {
        objProductosSeleccionadosC.push({
            stockid:row.stockid,
            descripcion:row.description,
            precio:row.precio,
            cantidad:row.cantidad,
            taxrate:row.taxrate,
            narrative:row.narrative,
            narrativeb:row.narrativeb
        });
    });

    fnMostrarProductosC(objProductosSeleccionadosC);
    
    /*
    $("#tblBProductos tbody").find("tr").each(function(){
        let selectProducto = data[0].productos.filter(producto => producto.stockid == $(this).find(".clsProducto").val());
        if(selectProducto.length >0){
            $(this).find(".clsCantidadProducto").val(selectProducto[0].cantidad);
        }
    });

    $("#tblCProductos tbody").find("tr").each(function(){
        let selectProductoC="";
        if(data[0].productosC.length>0){
             selectProductoC = data[0].productosC.filter(producto => producto.stockid == $(this).find(".clsProductoC").val());
        }else{
             selectProductoC = data[0].productos.filter(producto => producto.stockid == $(this).find(".clsProductoC").val());
        }
        if(selectProductoC.length >0){
            $(this).find(".clsPrecioCNew").val(selectProductoC[0].precio);
            $(this).find(".clsCantidadProductoC").val(selectProductoC[0].cantidad);
        }
    });
    */

    if(data[0].productos.length>0){
        fnCalcularValorEstimado();
        fnCalcularTotalCotizacion();
    }
}

function fnCalcularValorEstimado(){
    var valorEstimado=0;
    var precio = 0;
    var cantidad = 0;

    $.each($("#tblBProductos tbody").find(".clsCantidadProducto"), function(ind, row) {
        if($(this).val() !=""){
            let padre = $(this).parent().parent();
            precio = parseFloat($(this).data("precio"));
            cantidad = parseFloat($(this).val());
            padre.find(".clsTotalProducto ").val((precio * cantidad).toFixed(2));
            //$("#totalProducto"+ind).val((precio * cantidad).toFixed(2));
            valorEstimado += (precio * cantidad);
        }
    });

    $("#txtBTotalProducto").val(valorEstimado.toFixed(2));
    $("#txtValorEstimado").val(valorEstimado.toFixed(2));
}

function fnCalcularTotalCotizacion(){
    var valorEstimado=0;
    var precio = 0;
    var cantidad = 0;
    var subtotalrow = 0;
    var ivarow = 0;
    var totalrow = 0;
    var subtotal = 0;
    var iva = 0;
    var total = 0;

    $("#tblCProductos tbody").find("tr").each(function(){
        if($(this).find(".clsCantidadProductoC").val()!=""){
            precio = $(this).find(".clsPrecioCNew").val();
            cantidad = $(this).find(".clsCantidadProductoC").val();
            subtotalrow = parseFloat(precio) * parseFloat(cantidad);
            ivarow = parseFloat($(this).find(".clsIVAC").val());
            totalrow = (precio * cantidad) * (1 + ivarow);

            $(this).find(".clsSubTotalProductoC").val(subtotalrow.toFixed(2))
            $(this).find(".clsTotalProductoC").val(totalrow.toFixed(2))
            subtotal += subtotalrow;
            iva += subtotalrow * ivarow;
            total += totalrow;
        }
    });

    $("#txtCSubTotalProducto").val(subtotal.toFixed(2));
    $("#txtCTotalIVAProducto").val(iva.toFixed(2));
    $("#txtCTotalProducto").val(total.toFixed(2));

}

function fnMostrarImagenOportunidad(idOportunidad=0, sufijoid=''){
    if (sufijoid != ''){
        openNav();
        $("#contenedornotificaciones").empty();
        $("#contenedornotificaciones").append('Cargando datos...');
    }

    var fd = new FormData();
    
    fd.append("option","obtenerImagenesOportunidad");
    fd.append("idOportunidad", idOportunidad);

    var data = fnAjaxGeneral("", "POST", fd);
    
    $("#u_oportunidad"+sufijoid).val(idOportunidad);
    
    if(data.result){
        var strImagenOportunidad2="";

        if(data.contenido){
            $.each(data.contenido, function(ind, row) {
                /*strImagenOportunidad+="<tr>";
                strImagenOportunidad+="<td><a href='./images/prospectos/"+row.name+"' target='_blank'><img style='height:120px' src='./images/prospectos/"+row.name+"' alt='' class='img-rounded'></a></td>";
                strImagenOportunidad+="<td>"+row.name+"</td>";
                strImagenOportunidad+="<td>"+row.register_date+"</td>";
                strImagenOportunidad+="<td>"+row.user_register+"</td>";
                strImagenOportunidad+="</tr>";*/
                strImagenOportunidad2 += fndivImagenes("./images/prospectos/"+row.name, row.tipo, row.name, row.register_date +" - "+row.user_register, row.archivoblob, row.iddoc, idOportunidad, row.tamanoimagen, sufijoid, row.categoria);
            });
        }
       
        //$("#tblImagenesOportunidad tbody").html(strImagenOportunidad);
        $("#divImagenGrid"+sufijoid).html(strImagenOportunidad2);
        $("#btnGuardarAdjuntos"+sufijoid).addClass("btn btn-primary");
        $("#btnCerrarModalImagenes"+sufijoid).addClass("btn btn-default");
    }
    
    $("#txtMuestraArchivo"+sufijoid).val("");
    $("#divImagenesConvertidas"+sufijoid).empty();
    $("#divEsperaConvierteImagen"+sufijoid).text("");

    if (sufijoid == ''){
        $("#mdlImagenesOportunidad").modal("show");
    } else {
        $("#contenedornotificaciones").empty();        
        $("#lblTituloNotificaciones").html('<label>Archivos e Imagenes</label>&nbsp;&nbsp;&nbsp;<span class="glyphicon glyphicon-refresh" aria-hidden="true" onclick="fnMostrarImagenOportunidad('+idOportunidad+', \''+sufijoid+'\');" style="cursor: pointer;"></span>');
        $("#contenedornotificaciones").append($("#div"+sufijoid)[0].innerHTML);
    }
}

const comprimirImagen = (imagenComoArchivo, porcentajeCalidad, tipoimagen) => {
    return new Promise((resolve, reject) => {
        const $canvas = document.createElement("canvas");
        const imagen = new Image();
        imagen.onload = () => {
            $canvas.width = imagen.width;
            $canvas.height = imagen.height;
            $canvas.getContext("2d").drawImage(imagen, 0, 0);
            
            $canvas.toBlob(
                (blob) => {
                    if (blob === null) {
                        return reject(blob);
                    } else {
                        resolve(blob);
                    }
                },
                tipoimagen,
                porcentajeCalidad / 100
            );
        };
        imagen.src = URL.createObjectURL(imagenComoArchivo);
    });
};

function EtapaAImagenUploader(){
    this.pendingImages = [];
    this.savedImages = [];
    this.isProcessing = false;
    this.maxFiles = 10;
    this.maxTotalBytes = 10 * 1024 * 1024;
    this.quality = 60;
}

EtapaAImagenUploader.prototype.init = function(){
    var self = this;

    $("#etapaA_seleccionar").off("click").on("click", function(){
        $("#etapaA_archivos").trigger("click");
    });

    $("#etapaA_archivos").off("change").on("change", async function(){
        await self.handleFiles(this.files);
        this.value = "";
    });

    $("#etapaA_limpiar").off("click").on("click", function(){
        self.clearPending();
    });

    $(document).off("click.etapaAImagenes").on("click.etapaAImagenes", ".btn-etapa-a-remove", function(){
        self.removePending($(this).data("index"));
    });

    self.render();
};

EtapaAImagenUploader.prototype.reset = function(){
    this.pendingImages = [];
    this.savedImages = [];
    this.isProcessing = false;
    $("#etapaA_archivos").val("");
    this.render();
};

EtapaAImagenUploader.prototype.clearPending = function(){
    this.pendingImages = [];
    $("#etapaA_archivos").val("");
    this.render();
};

EtapaAImagenUploader.prototype.removePending = function(index){
    if (typeof index === "undefined") {
        return false;
    }

    this.pendingImages.splice(index, 1);
    this.render();
};

EtapaAImagenUploader.prototype.hasPendingImages = function(){
    return this.pendingImages.length > 0;
};

EtapaAImagenUploader.prototype.getPendingTotalBytes = function(){
    var total = 0;

    $.each(this.pendingImages, function(ind, row) {
        total += parseInt(row.tamanoProcesado, 10) || 0;
    });

    return total;
};

EtapaAImagenUploader.prototype.handleFiles = async function(files){
    var self = this;
    var archivos = Array.prototype.slice.call(files || []);
    var mensajes = [];
    var totalActual = self.getPendingTotalBytes();
    var nuevosArchivos = [];

    if (!archivos.length) {
        return false;
    }

    self.isProcessing = true;
    self.render();

    for (const archivo of archivos) {
        if (!archivo.type || archivo.type.indexOf("image/") !== 0) {
            mensajes.push("Se omitió " + archivo.name + " porque no es una imagen.");
            continue;
        }

        if ((self.pendingImages.length + nuevosArchivos.length) >= self.maxFiles) {
            mensajes.push("Solo se permiten hasta " + self.maxFiles + " imágenes en la Etapa A.");
            break;
        }

        try {
            var imagenProcesada = await self.processFile(archivo);

            if ((totalActual + imagenProcesada.tamanoProcesado) > self.maxTotalBytes) {
                mensajes.push("Se omitió " + archivo.name + " porque el total supera 10 MB.");
                continue;
            }

            totalActual += imagenProcesada.tamanoProcesado;
            nuevosArchivos.push(imagenProcesada);
        } catch (error) {
            mensajes.push("No fue posible procesar " + archivo.name + ".");
        }
    }

    self.pendingImages = self.pendingImages.concat(nuevosArchivos);
    self.isProcessing = false;
    self.render();

    if (mensajes.length) {
        fnAlertaGeneral("Imágenes Etapa A", mensajes.join(" "), "warning");
    }

    return true;
};

EtapaAImagenUploader.prototype.processFile = async function(file){
    var mimeType = file.type || "image/jpeg";
    var archivoProcesado = file;

    if (this.canCompressType(mimeType) && file.size > 1048576) {
        archivoProcesado = await comprimirImagen(file, this.quality, mimeType);
    }

    var dataUrl = await this.toDataUrl(archivoProcesado);

    return {
        nombreOriginal: file.name,
        nombre: this.buildUploadName(archivoProcesado.type || mimeType),
        tipo: archivoProcesado.type || mimeType,
        cadena: dataUrl,
        preview: dataUrl,
        tamanoOriginal: file.size,
        tamanoProcesado: archivoProcesado.size || file.size
    };
};

EtapaAImagenUploader.prototype.canCompressType = function(mimeType){
    return /image\/(jpeg|jpg|png|webp)/i.test(mimeType || "");
};

EtapaAImagenUploader.prototype.toDataUrl = function(fileBlob){
    return new Promise(function(resolve, reject){
        var reader = new FileReader();

        reader.onload = function() {
            resolve(reader.result);
        };

        reader.onerror = function() {
            reject(reader.error);
        };

        reader.readAsDataURL(fileBlob);
    });
};

EtapaAImagenUploader.prototype.buildUploadName = function(mimeType){
    var extension = "jpg";
    var nombre = "";

    if (mimeType && mimeType.indexOf("/") !== -1) {
        extension = mimeType.split("/")[1].toLowerCase();
    }

    if (extension === "jpeg") {
        extension = "jpg";
    }

    if (typeof uuid !== "undefined" && uuid.v1) {
        nombre = uuid.v1();
    } else {
        nombre = "img_" + new Date().getTime() + "_" + Math.floor(Math.random() * 10000);
    }

    return nombre + "." + extension;
};

EtapaAImagenUploader.prototype.escapeHtml = function(texto){
    return String(texto || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

EtapaAImagenUploader.prototype.isImageExtension = function(tipo, nombre){
    var extension = String(tipo || "").toLowerCase();

    if (!extension && nombre && nombre.indexOf(".") !== -1) {
        extension = nombre.split(".").pop().toLowerCase();
    }

    if (extension.indexOf("/") !== -1) {
        extension = extension.split("/")[1];
    }

    return $.inArray(extension, ["jpg", "jpeg", "png", "gif", "webp", "bmp"]) !== -1;
};

EtapaAImagenUploader.prototype.renderCard = function(configuracion){
    var botonEliminar = "";

    if (configuracion.estado === "pending") {
        botonEliminar = '<button type="button" class="btn btn-default btn-etapa-a-remove" data-index="' + configuracion.index + '">Quitar</button>';
    }

    return '' +
        '<div class="col-md-3 col-sm-4 col-xs-6 etapa-a-preview-item">' +
            '<div class="etapa-a-preview-card is-' + configuracion.estado + '">' +
                '<div class="etapa-a-preview-thumb">' +
                    '<a href="' + configuracion.href + '" target="_blank">' +
                        '<img src="' + configuracion.preview + '" alt="' + this.escapeHtml(configuracion.nombre) + '">' +
                    '</a>' +
                '</div>' +
                '<div class="etapa-a-preview-body">' +
                    '<span class="etapa-a-preview-name">' + this.escapeHtml(configuracion.nombre) + '</span>' +
                    '<div class="etapa-a-preview-meta">' +
                        '<span class="etapa-a-preview-status ' + configuracion.estado + '">' + configuracion.estadoTexto + '</span>' +
                        '<span>' + this.escapeHtml(configuracion.descripcion) + '</span>' +
                    '</div>' +
                    '<a class="etapa-a-preview-link" href="' + configuracion.href + '" target="_blank">Abrir imagen</a>' +
                    (botonEliminar ? '<div style="margin-top:10px;">' + botonEliminar + '</div>' : '') +
                '</div>' +
            '</div>' +
        '</div>';
};

EtapaAImagenUploader.prototype.updateInfo = function(){
    var mensajes = [];

    if (this.isProcessing) {
        mensajes.push("Procesando imágenes, por favor espera...");
    }

    if (this.pendingImages.length) {
        mensajes.push(this.pendingImages.length + " imagen(es) listas para subir (" + bytesToSize(this.getPendingTotalBytes()) + ").");
    }

    if (this.savedImages.length) {
        mensajes.push(this.savedImages.length + " imagen(es) guardadas en el prospecto.");
    }

    if (!mensajes.length) {
        mensajes.push("Selecciona imágenes para agregarlas al prospecto. El total permitido es de 10 MB.");
    }

    $("#etapaA_info").text(mensajes.join(" "));
};

EtapaAImagenUploader.prototype.render = function(){
    var html = "";
    var self = this;

    $.each(self.pendingImages, function(ind, row) {
        html += self.renderCard({
            estado: "pending",
            estadoTexto: "Pendiente",
            nombre: row.nombreOriginal,
            preview: row.preview,
            href: row.preview,
            descripcion: bytesToSize(row.tamanoProcesado),
            index: ind
        });
    });

    $.each(self.savedImages, function(ind, row) {
        html += self.renderCard({
            estado: "saved",
            estadoTexto: "Guardada",
            nombre: row.nombre,
            preview: row.preview,
            href: row.href,
            descripcion: row.descripcion,
            index: ind
        });
    });

    if (html === "") {
        html = '<div class="col-md-12"><div class="etapa-a-preview-empty">Aún no hay imágenes seleccionadas para esta oportunidad.</div></div>';
    }

    $("#etapaA_preview").html(html);
    $("#etapaA_limpiar").toggleClass("hide", !self.pendingImages.length);
    $("#etapaA_seleccionar").prop("disabled", self.isProcessing);
    $("#etapaA_limpiar").prop("disabled", self.isProcessing);
    self.updateInfo();
};

EtapaAImagenUploader.prototype.buildPayload = function(){
    return $.map(this.pendingImages, function(row) {
        return {
            cadena: row.cadena,
            nombre: row.nombre,
            tipo: row.tipo
        };
    });
};

EtapaAImagenUploader.prototype.uploadPending = function(idOportunidad){
    var fd = new FormData();
    var data = {
        result: true,
        skipped: true
    };

    if (!idOportunidad) {
        return data;
    }

    if (!this.pendingImages.length) {
        this.loadSavedImages(idOportunidad);
        return data;
    }

    fd.append("u_oportunidad", idOportunidad);
    fd.append("imagenesconvertidas", JSON.stringify(this.buildPayload()));
    fd.append("option","GuardarAdjuntos");

    data = fnAjaxGeneral("", "POST", fd);

    if (!data || typeof data !== "object") {
        return {
            result: false,
            skipped: false
        };
    }

    if (data.result) {
        this.pendingImages = [];
        this.loadSavedImages(idOportunidad);
        data.skipped = false;
        return data;
    }

    data.skipped = false;
    return data;
};

EtapaAImagenUploader.prototype.loadSavedImages = function(idOportunidad){
    var fd = new FormData();
    var data = "";
    var savedImages = [];
    var self = this;

    if (!idOportunidad) {
        self.savedImages = [];
        self.render();
        return false;
    }

    fd.append("option","obtenerImagenesOportunidad");
    fd.append("idOportunidad", idOportunidad);

    data = fnAjaxGeneral("", "POST", fd);

    if (data && data.result && data.contenido) {
        $.each(data.contenido, function(ind, row) {
            if (!self.isImageExtension(row.tipo, row.name)) {
                return true;
            }

            savedImages.push({
                nombre: row.name,
                preview: row.archivoblob || "./images/prospectos/" + row.name,
                href: row.archivoblob || "./images/prospectos/" + row.name,
                descripcion: row.tamanoimagen || ""
            });
        });
    }

    self.savedImages = savedImages;
    self.render();
    return true;
};

async function fnArchivosSeleccionados(sufijoid='') {
    const $imagenes = document.querySelector("input[id=fileEvidenciasModal"+sufijoid+"]"), $calidad = 0.6;
    var curFiles= $imagenes.files;
    var entrada= $("#txtMuestraArchivo"+sufijoid);
    var archivos= "";
    var tamano= 0;
    var mensaje= "";
    var blob="";

    $("#divImagenesConvertidas"+sufijoid).empty();

    if(curFiles.length === 0) {
        mensaje= "Favor de seleccionar archivo...";
        entrada.val(mensaje);
    } else {
        for(const file of curFiles) {
            archivos= archivos + file.name + ", ";
            tamano+= file.size;
        }

        if (mensaje !== "" || mensaje.length !== 0){
            $("#txtTamano"+sufijoid).text(mensaje);
        } else {
            entrada.val(archivos.substr(0, archivos.length-2));
            $("#txtTamano"+sufijoid).text(bytesToSize(tamano));
        }

        $("#divEsperaConvierteImagen"+sufijoid).text("Procesando imagen/s por favor espere...");

        for (var imagen in $imagenes.files){
            if (typeof($imagenes.files[imagen]) == "object"){
                //if ($imagenes.files[imagen].type.includes("image")){
                    let oGrayImg= new Image();
                    const archivo = $imagenes.files[imagen];

                    oGrayImg.width="60";
                    oGrayImg.height="65";
                    oGrayImg.alt=archivo.type;
                    oGrayImg.id=archivo.name.replace(" ", "_");
                    //oGrayImg.src= URL.createObjectURL(blob);
                    
                    if (archivo.type.includes("image") && archivo.size > 1048576){
                        blob = await comprimirImagen(archivo, $calidad, archivo.type);
                    } else {
                        blob = archivo;
                    }
        
                    let reader = new FileReader();
                    reader.readAsDataURL(blob); // convierte el blob a base64 y llama a onload
        
                    reader.onload = function() {
                        //link.href = reader.result; // URL de datos
                        //link.click();
                        oGrayImg.src= reader.result;
                        $("#divImagenesConvertidas"+sufijoid).append(oGrayImg);
                    };
                //}   
            }
        }

        $("#divEsperaConvierteImagen"+sufijoid).text("Imagen convertida, ya se puede guardar...");
        $("#btnGuardarAdjuntos"+sufijoid).removeClass("hide");
    }
}

//Convertir en funcione generales
function fndivImagenes(enlace, tipo, nombre, descripcion='', archivoblob="", idarchivo, idoportunidad, tamanoimagen, sufijoid='', categoria='imagen'){
    let divImagen="";
    let imagen=enlace;
    let css="width:60%;height:150px;"; //para icono por defutl

    switch (tipo) {
        case "docx":
        case "doc":
            imagen="./images/prospectos/icon_word.png";
            css="width:60%;height:150px;";
          break;
        case "PDF":
        case "pdf":
            imagen="./images/prospectos/icon_pdf.png";
          break;
        case "xls":
        case "xlsx":
            imagen="./images/prospectos/ico_excel.png";
          break;
        case "txt":
            imagen="./images/prospectos/ico_file.png";
            break;
        default:
            css="width:100%;height:150px;";
    }

    // Badge visual por categoria
    var categoriaLimpia = (categoria || 'imagen').toLowerCase();
    var badgeColor = "#5bc0de", badgeTexto = "Imagen";
    if (categoriaLimpia === "documento"){ badgeColor = "#337ab7"; badgeTexto = "Documento"; }
    else if (categoriaLimpia === "pago"){ badgeColor = "#5cb85c"; badgeTexto = "Comprobante de pago"; }

    divImagen='<div class="col-md-4 col-xs-12 card-adjunto-categoria" data-categoria="'+categoriaLimpia+'" data-aos="fade-up" data-aos-delay="100" style="background-color: #F2F2F2;border-radius: 5px;padding-top: 11px; border: 2px solid white;">';

    if (archivoblob != ""){
        enlace= archivoblob;
        imagen= archivoblob;
    }

    divImagen+='<span style="position:absolute; top:6px; left:16px; background:'+badgeColor+'; color:#fff; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; z-index:1;">'+badgeTexto+'</span>';
    divImagen+='<a href="'+enlace+'" target="_blank"><img src="'+imagen+'" alt="Image" class="img-fluid-blog" style="'+css+'"></a>';
    divImagen+='<div class="p-4 bg-white text-left">'; 
    divImagen+='    <div class="col-md-10 col-xs-10">';
    divImagen+='        <h2 class="h5 text-black mb-3"><a href="'+enlace+'" target="_blank">'+nombre+" Tamaño: "+tamanoimagen+'</a></h2>';      
    divImagen+='        <p>'+descripcion+'</p>';  
    divImagen+='    </div>';
    divImagen+='    <div class="col-md-2 col-xs-2" style="margin-top: 18px;">';
    divImagen+='        <span class="glyphicon glyphicon-trash" aria-hidden="true" style="color: red;font-size: 16pt; cursor: pointer;" onclick="fnEliminaImagen('+idarchivo+', '+idoportunidad+', \''+sufijoid+'\');" style="cursor: pointer;"></span>';
    divImagen+='    </div>';
    divImagen+='</div>';
    
    divImagen+='</div>';

    return divImagen;
}

// Filtro por categoria en el panel de archivos adjuntos
function fnFiltrarCategoriaAdjuntos(categoria, sufijoid){
    var contenedor = $("#divImagenGrid"+sufijoid);
    if (contenedor.length === 0) return;

    if (categoria === "todas"){
        contenedor.find(".card-adjunto-categoria").show();
    } else {
        contenedor.find(".card-adjunto-categoria").hide();
        contenedor.find(".card-adjunto-categoria[data-categoria='"+categoria+"']").show();
    }

    // Marcar pestana activa
    $(".tab-categoria-adjunto"+sufijoid).removeClass("active").css({"background":"#f5f5f5","color":"#333"});
    $("#tabCategoria_"+categoria+sufijoid).addClass("active").css({"background":"#337ab7","color":"#fff"});
}

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return 'n/a';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (i == 0) return bytes + ' ' + sizes[i];
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
}

function fnCambiarEtapa(idOportunidad=0, estatusActual=0, vendedor="", fechacompromiso=""){
    if (fechacompromiso != ""){
        $('#txtModificarFechaActividad').datepicker("setDate", fechacompromiso);    
    } else {
        $('#txtModificarFechaActividad').datepicker("setDate", new Date());
    }
    
    $("#u_oportunidad_").val(idOportunidad);
    $("#cmbCambiarEstatus").val(estatusActual);
    $("#cmbVendedor03").val(vendedor);

    $("#cmbCambiarEstatus").multiselect('rebuild');
    $("#cmbVendedor03").multiselect("rebuild");

    $("#mdlModifciarEstatus").modal("show");
}

function fnGuardarCambioEstatus(){
    //Validamos el cambio de estatus actual vs la nueva
    let newestatus = parseInt($("#cmbCambiarEstatus").val());
    let oldEstatus = parseInt($("#txtEstatusActual").val());
    let fechacompromiso= $("#txtModificarFechaActividad").val();
    
    if(newestatus > oldEstatus){
        if(newestatus!=5){
            fnAlertaGeneral("Info","La etapa debe ser inferior a la etapa actual", "info");
            return false;
        }
    }

    var fd = new FormData(document.getElementById("frmCambiarEstatus"));

    fd.append("option","GuardarCambioEstatus");
    fd.append("u_movimiento", $("#u_oportunidad_").val());
    fd.append("fechacompromiso", fechacompromiso);

    var data = fnAjaxGeneral("", "POST", fd);

    if(data.result){
        fnAlertaGeneral("Correcto","Se cambio correctamente", "success");
        $("#mdlModifciarEstatus").modal("hide");
    }
}

function fnMostrarCheckTiempoVida(){
    if(!blnCargarCicloTiempoVida){
        return false;
    }
    var fd = new FormData();
    fd.append("option","obtenerCheckTiempoVida");

    var data = fnAjaxGeneral("", "POST", fd);
    $("#tblCCheckList tbody").empty();
    if(data.result){
        blnCargarCicloTiempoVida=false;
        var strCheckTiempoVida="";
        $.each(data.contenido, function(ind, row) {
            strCheckTiempoVida+="<tr>";
            strCheckTiempoVida+="<td>"+row.descripcion+"</td>";
            strCheckTiempoVida+="<td><div class='radio' style='margin-top:1px;margin-bottom:1px;'><label><input type='radio' name='rdTiempoVida"+row.id+"' class='clsCheckTiempoVida' data-idconcepto='"+row.id+"' data-idsuperficie='1' data-valortv='"+row.pesimo+"'></label></div></td>";
            strCheckTiempoVida+="<td><div class='radio' style='margin-top:1px;margin-bottom:1px;'><label><input type='radio' name='rdTiempoVida"+row.id+"' class='clsCheckTiempoVida' data-idconcepto='"+row.id+"' data-idsuperficie='2' data-valortv='"+row.malo+"'></label></div></td>";
            strCheckTiempoVida+="<td><div class='radio' style='margin-top:1px;margin-bottom:1px;'><label><input type='radio' name='rdTiempoVida"+row.id+"' class='clsCheckTiempoVida' data-idconcepto='"+row.id+"' data-idsuperficie='3' data-valortv='"+row.regular+"'></label></div></td>";
            strCheckTiempoVida+="<td><div class='radio' style='margin-top:1px;margin-bottom:1px;'><label><input type='radio' name='rdTiempoVida"+row.id+"' class='clsCheckTiempoVida' data-idconcepto='"+row.id+"' data-idsuperficie='4' data-valortv='"+row.bueno+"'></label></div></td>";
            strCheckTiempoVida+="<td><div class='radio' style='margin-top:1px;margin-bottom:1px;'><label><input type='radio' name='rdTiempoVida"+row.id+"' class='clsCheckTiempoVida' data-idconcepto='"+row.id+"' data-idsuperficie='5' data-valortv='"+row.excelente+"'></label></div></td>";
            strCheckTiempoVida+="</tr>";
        });
        
        $("#tblCCheckList tbody").html(strCheckTiempoVida);
    }
}

function fnGuardarEtapaC(){
    var fd = new FormData(document.getElementById("formProspecto"));
    var esModificacion = ($("#txtIdOrderNo").val() != "");
    if(!esModificacion){
        fd.append("option","GuardarEtapaC");
    }else{
        fd.append("option","ModificarEtapaC");
    }
    var productos_estapac = new Object();
    fd.append("subtotal",$("#txtCSubTotalProducto").val());
    fd.append("iva",$("#txtCTotalIVAProducto").val());
    fd.append("total",$("#txtCTotalProducto").val());

    let contador=0;
    $("#tblCProductos tbody").find("tr").each(function(){
        if($(this).find(".clsCantidadProductoC").val()!=""){
            productos_estapac[contador] = new Object();
            productos_estapac[contador].stockid = $(this).find(".clsProductoC").val();
            productos_estapac[contador].precio = $(this).find(".clsPrecioCNew").val();
            productos_estapac[contador].cantidad = $(this).find(".clsCantidadProductoC").val();
            productos_estapac[contador].iva = $(this).find(".clsIVAC").val();
            productos_estapac[contador].descripcion = $(this).find(".clsDescripcionProducto").val();
            productos_estapac[contador].bandera = $(this).find(".banderaDes").val();
            productos_estapac[contador].descuento1 = 0;
            contador++;
        }
    });
    fd.append("productosC",JSON.stringify(productos_estapac));

    var data = fnAjaxGeneral("", "POST", fd);

    if(data.result){
        $.each(data.contenido, function(ind, row) {
            if(row.orderno!=""){
                $("#linkVerCotizacion").attr("href", "CotizacionProspecto.php?OrderNo="+row.orderno);
                $("#txtIdOrderNo").val(row.orderno);
            }
        });

        fnAlertaGeneral("Correcto","Se guardo correctamente la etapa C", "success");
        if(esModificacion){
            $("#divCCotizacion").removeClass("hide");
            $("#divCCotizar").addClass("hide");
            blnModificarCotizacion = false;
        } else {
            traerRegistroB(2);
        }
    }else{
        fnAlertaGeneral("Error","Problemas al guardar etapa C", "warning");
    }
}

function fnValidarCamposEtapaB(){
    let blnProceso=true;
    let msjValidacion ="";

    if($("#txtPuntosTV").val()==""){
        blnProceso= false;
        msjValidacion+="Es necesario capturar el tiempo de vida.";
    }

    if($("#txtValorEstimado").val()=="" || parseFloat($("#txtValorEstimado").val()) == 0){
        blnProceso= false;
        msjValidacion+=" Es necesario capturar el valor estimado.";
    } 

    if (parseFloat($("#txtValorEstimado").val()) < 1000){
        blnProceso= false;
        msjValidacion+="Favor de revisar si el valor estimado es correcto. debe ser mayor a Mil Pesos.";
    }

    if($("#txtAreaTotal").val() == ""){
        blnProceso= false;
        msjValidacion+= "Se requiere el area total estimada.";
    }

    $(".clsCantidadProducto").each(function(){ 
        //maximo
    });

    /* sin validación adjuntos */

    if(!blnProceso){
        fnAlertaGeneral("Validación", msjValidacion, "warning");
    }

    return blnProceso;
}

// Funcion para guardar la actividad mas reciente
function fnGuardarActividad(){
    if($("#txtTituloActividad").val()==""){
        fnAlertaGeneral("Validación","Es necesario capturar un titulo", "warning");
        return false;
    }

    var fd2 = new FormData(document.getElementById("formActividad"));
    fd2.append("option","ValidarRepuestaUltimaActividad");
    var data2 = fnAjaxGeneral("", "POST", fd2);

    if(data2.result){
        var fd = new FormData(document.getElementById("formActividad"));
        fd.append("option","GuardarActividad");


        var data = fnAjaxGeneral("", "POST", fd);
    
        if(data.result){
            $("#mensajeactividad2").addClass("hide");
            $("#mensajeactividad1").text("Se guardo actividad correctamente");
            $("#msjActividad1").removeClass("hide");
            $("#btnGuardarActividad").addClass("hide");
            fnTraeHistorial($("#txtMovimiento").val());
        } else {
            $("#mensajeactividad1").addClass("hide");
            $("#mensajeactividad2").text("Hubo un problema al inntentar guardar los datos");
            $("#msjActividad2").removeClass("hide");
        }
    }else{
        fnAlertaGeneral("Validación","La ultima actividad no tiene una respuesta", "warning");
    }
}

// Funcion para guardar la actividad mas reciente
function fnGuardarActividadNuevo(){
    try {
        if($("#txtDescripcionActividadNuevo").val() == ""){
            fnAlertaGeneral("Validación", "Es necesario capturar una descripcion", "warning");
            return false;
        }

        if ($("#cmbHoras").val() == "00"){
            fnAlertaGeneral("Validación", "Es necesario seleccionar una hora adecuada", "warning");
            return false;
        }

        let contacto = $('input[name="contactoRespuesta"]:checked').val();
        contacto = (typeof contacto === 'undefined') ? 0 : contacto;

        var fd = new FormData();
        fd.append("txtFechaActividad", $("#txtFechaActividadNuevo").val());
        fd.append("txtHora", $("#cmbHoras").val());
        fd.append("txtMinutos", $("#cmbMinutos").val());
        fd.append("txtTituloActividad", $("#cmbTipoActividadNuevo option:selected").text());
        fd.append("txtDescripcionActividad", $("#txtDescripcionActividadNuevo").val());
        fd.append("txtMovimiento", $("#lblProspectoIDActividad").text());
        fd.append("cmbTipoActividad", $("#cmbTipoActividadNuevo").val());
        fd.append("actividad_id", parseInt($("#lblNumeroActividadNueva").text()));
        fd.append("contactado", contacto);

        fd.append("option", "GuardarActividad");
    
        var data = fnAjaxGeneral("", "POST", fd);
    
        if(data.result){
            $.each(data.contenido, function(ind, row) {
                $("#lblNumeroActividadNueva").text(row.id_actividad);
            });
            
            $("#lblMensajeNuevaActividad").removeClass("hide");
            fnTraeInfoProspecto($("#lblProspectoIDActividad").text());
            fnAlertaGeneral("Exito", "Se guardo la actividad correctamente", "success");
        } else {
            fnAlertaGeneral("Error", data.msjError || "Problemas al guardar la actividad...", "warning");
        }
    } catch (excepcion) {
        console.log("error en la ejecucion: "+excepcion);
    }
}

// Funcion para guardar comentario mas reciente
function fnGuardarComentario(idActividad, txtComentario, contactado = 0){
    var fd = new FormData();
    fd.append("option","GuardarComentario");
    fd.append("idactividad",idActividad);
    fd.append("txtcomentario",txtComentario);
    fd.append("contactado", contactado);

    var data = fnAjaxGeneral("", "POST", fd);

    if(data.result){
        fnTraeHistorial($("#txtMovimiento").val());
    } else {
        fnAlertaGeneral("Error","Problemas al guardar comentario", "warning");
    }
}

// Funcion para guardar comentario mas reciente
function fnGuardarComentarioNuevo(idActividad, txtComentario, checkedValue){
    var fd = new FormData();
    fd.append("option","GuardarComentario");
    fd.append("idactividad",idActividad);
    fd.append("txtcomentario",txtComentario);
    fd.append("contactado", checkedValue);

    var data = fnAjaxGeneral("", "POST", fd);

    if(data.result){
        //fnTraeHistorial($("#txtMovimiento").val());
        fnAlertaGeneral("Exito", "Se guardo la respuesta a la actividad", "success");

        return true;

    } else {
        fnAlertaGeneral("Error","Problemas al guardar comentario", "warning");

        return false;
    }
}

function fnGuardarActividadGenereal(fecha,titulo,comentarios,oportunidad){
    var fd = new FormData();
    fd.append("option","GuardarActividadGeneral");
    fd.append("txtFechaActividad",fecha);
    fd.append("txtTituloActividad",titulo);
    fd.append("txtDescripcionActividad",comentarios);
    fd.append("txtMovimiento",oportunidad);

    var data = fnAjaxGeneral("", "POST", fd);

    return data.result;
}

function fnGeneraNuevaActividad(prospectoid, nombre, vendedorid,automatico=false){
    try {
        $("#lblProspectoIDActividad").text(prospectoid);
        $("#lblProspectoNombreActividad").text(nombre);
        $("#idvendedor").val(vendedorid);
        $("#txtDescripcionActividadNuevo").val("");
        $('#label2').addClass('btn-selected');
        $('#label2').addClass('active');
        $('#label1').removeClass('active');
        $('#label1').removeClass('btn-selected');
        $('#txtFechaActividadNuevo').datepicker("setDate", new Date());
        $('#txtFechaActividadNuevo').prop("disabled", "");
        $("#cmbHoras").val("00");
        $("#cmbMinutos").val("00");
        $("#lblMensajeNuevaActividad").addClass("hide");
        $("#btnGuardarActividadNuevo").prop("disabled", "");

        $("#lblNumeroActividadNueva").text("");
        
        if (!automatico){
            $("#btnCerrarActividad").removeClass("hide");
        } else {
            $("#btnCerrarActividad").addClass("hide");
        }

        init_calendar("divCalendarioActividad", false);

        $("#modalNuevaActividad").modal("show");
        
        $('#divCalendarioActividad').fullCalendar('option', 'contentHeight', 420);
        $("#divCalendarioActividad").fullCalendar('render');

        //let fechaActual = $("#txtFechaActividadNuevo").datepicker("getDate");
        //fechaActual.setDate(fechaActual.getDate() + 1);
        //$("#txtFechaActividadNuevo").datepicker("setDate", fechaActual);

    } catch (excepcion) {
        console.log("error en la ejecucion: "+excepcion);
    }
}

function fnModificaNuevaActividad(actividad_id){
    try {
        var fd = new FormData();
        fd.append("option","traeActividad");
        fd.append("actividad_id", actividad_id);

        var data = fnAjaxGeneral("", "POST", fd);

        if(data.result){
            $.each(data.contenido, function(ind, row) {
                const separahora= row.hora.split(":");
                
                $("#divLogoEtapaActividad").empty();
                $("#divLogoEtapaActividad").append($("#divLogoEtapa")[0].innerHTML);

                $("#lblProspectoIDActividad").text(row.u_prospecto);
                $("#lblNumeroActividadNueva").text(ind);
                $("#lblProspectoNombreActividad").text(row.prospecto);
                $("#txtDescripcionActividadNuevo").val(row.descripcion);
                $('#txtFechaActividadNuevo').datepicker("setDate", new Date(row.fecha_compromiso+" "+row.hora));
                $('#txtFechaActividadNuevo').prop("disabled", "disabled");

                if ($("#txAasdfasdfiq3b82347b8").val() == "scenteno"){
                    $('#txtFechaActividadNuevo').prop("disabled", "");    
                }

                $("#cmbHoras").val(separahora[0]);
                $("#cmbMinutos").val(separahora[1]);
                $("#cmbTipoActividadNuevo").val(row.tipomovimiento);

                if (row.contactado == 1) {
                    $('#label1').addClass('btn-selected');
                    $('#label1').addClass('active');
                    $('#label2').removeClass('active');
                    $('#label2').removeClass('btn-selected');
                } else {
                    $('#label2').addClass('btn-selected');
                    $('#label2').addClass('active');
                    $('#label1').removeClass('active');
                    $('#label1').removeClass('btn-selected');
                }

                $("#lblNumeroActividadNueva").text(actividad_id);
                $("#lblMensajeNuevaActividad").removeClass("hide");

                $("#lblMensajeNuevaActividad").addClass("hide");
                $("#btnGuardarActividadNuevo").prop("disabled", "");
                $("#btnCerrarActividad").removeClass("hide");
        
                init_calendar("divCalendarioActividad", false);

                $("#modalNuevaActividad").modal("show");
                $("#divCalendarioActividad").fullCalendar('render');
            });

            return true;

        } else {
            fnAlertaGeneral("Error","Problemas al recuperar los datos de la actividad", "warning");
            return false;
        }
        
    } catch (excepcion) {
        console.log("error en la ejecucion: "+excepcion);
    }
}

/**
 * Función para obtener todos los datos generales de un prospecto
 * @param  {String} prospectoid identificador o numero de prospecto
 * @return {[type]} [description]
 */
function fnTraeInfoProspecto(prospectoid){
    try {
        var fd = new FormData();
        var barraetapa= "";
        var fechaini="";
        var fechafin="";
        var porcentajedias=0;
        var diferenciadias=0;
        var coloretapa="";
        var totaldias=0;
        var bordeinicial="";
        var iconofinal="";
        var barraiconos="";
        var ultimarespuesta="";
        var doblerenglon= "";
        var mostrarrespuesta="";
        var actividadvencida=0;
        var diasenbasededatos=0;

        var arrEstatus= ['0', '6', '8'];

        // limpiar barra de dias de etapas y tabla de actividades
        $("#progresos").empty();
        $("#progresos2").empty();
        $("#totaldias").text("0d"); 
        $("#tbInfoActividades").empty();
        $("#lblTituloNotificaciones").html('<label>Informacion General del Prospecto</label>&nbsp;&nbsp;&nbsp;<span class="glyphicon glyphicon-refresh" aria-hidden="true" onclick="fnTraeInfoProspecto('+prospectoid+');" style="cursor: pointer;"></span>');

        fd.append("option","traeInfoProspecto");
        fd.append("idOportunidad", prospectoid);

        var data = fnAjaxGeneral("", "POST", fd);

        if(data.result){
            $.each(data.contenido, function(ind, row) {
                $("#divLogoEtapa").empty();
                $("#divLogoEtapa").append('<img id="imgInfoLogo" width=50 height=50 src="images/'+row.logo+'" border="0" onclick="fnEtapaB('+row.prospectoid+');" style="cursor: pointer;">');
				$("#divLogoEtapa").append('<span id="lblInfoEtapa">'+"Etapa "+row.nombrealterno+'</span>');
                $("#spADSfasdfaswn98374").text(row.calificacion.toFixed(0));

                //$("#imgInfoLogo").attr("src", "images/"+row.logo);
                //$("#lblInfoEtapa").text("Etapa "+row.nombrealterno);
                $("#lblInfoValorEstimado").text("$ "+ new Intl.NumberFormat().format(row.cargo));
                $("#lblInfoOportunidad").text(row.prospectoid);
                $("#lblInfoProspecto").text("["+row.debtorno+"] "+row.prospecto);
                $("#lblInfoContacto").text(row.nombre_contacto);
                $("#lblInfoTelefono").text(row.telefonos_contacto);
                $("#lblInfoCorreo").text(row.correos_contacto);
                $("#lblInfoSector").text(row.sector_comercial);
                $("#lblInfoVendedor").text(row.vendedor);
                $("#lblInfoFuente").text(row.fuente_contacto);
                $("#lblFechaComp").text(row.fecha_cierre);
                $("#lblInfoSuperficie").text(row.area_total+" m2");
                $("#lblInfoClasificacion34234sd").text(row.clasificacion);

                if (row.fecha_cierre != ""){
                    fechaini= moment(row.fecha_cierre);
                    fechafin= moment(new Date());
                    diferenciadias= fechafin.diff(fechaini, "days");

                    // validar si esta vencida la fecha de cierre y calcular los dias que lleva vencida
                    if (diferenciadias > 0){
                        $("#divFechaCompromiso").css("background-color", "indianred");
                        $("#divFechaCompromiso").css("color", "white");
                        $("#spCierreVencido").text("Vencido "+diferenciadias+"d");
                    } else {
                        $("#divFechaCompromiso").css("background-color", "#e4ffe4");
                        $("#divFechaCompromiso").css("color", "black");
                        $("#spCierreVencido").css("color", "whitesmoke")
                        $("#spCierreVencido").text("Vence "+Math.abs(diferenciadias)+"d");
                    }
                }

                var lnkpedidoventa= '<button type="button" class="btn btn-default disabled" data-toggle="tooltip" data-placement="right" title="Ir al Pedido de Venta">'+
                                        '<span class="glyphicon glyphicon-usd" aria-hidden="true"></span>'+
                                    '</button>'+
                                    '<span>&nbsp;&nbsp;</span>'+
                                    '<button type="button" class="btn btn-default disabled" data-toggle="tooltip" data-placement="right" title="Imprimir Documentos">'+
                                        '<span class="glyphicon glyphicon-print" aria-hidden="true"></span>'+
                                    '</button>';

                if (row.pedidoventa != "0"){
                    lnkpedidoventa= '<a target="_blank" href="SelectOrderItemsV7_0.php?&ModifyOrderNumber='+row.pedidoventa+'">'+
                                        '<button type="button" class="btn btn-success" data-toggle="tooltip" data-placement="right" title="Ir al Pedido de Venta">'+
                                            '<span class="glyphicon glyphicon-usd" aria-hidden="true"></span>'+
                                        '</button>'+
                                    '</a>'+
                                    '<span>&nbsp;&nbsp;</span>'+
                                    '<button type="button" class="btn btn-success" data-toggle="tooltip" data-placement="right" title="Imprimir Documentos" onclick="fnDocumentosAdminModal('+prospectoid+');">'+
                                        '<span class="glyphicon glyphicon-print" aria-hidden="true"></span>'+
                                    '</button>';
                                    
                }

                $("#cntBotonesAcciones").empty();
                $("#cntBotonesAcciones").append('<button id="btnAgregaNuevaActividad" type="button" class="btn btn-primary" data-toggle="tooltip" data-placement="right" title="" data-original-title="Nueva Actividad" onclick="fnGeneraNuevaActividad('+prospectoid+', \''+row.prospecto+'\', \''+row.vendedorid+'\');"><span class="glyphicon glyphicon-th-list" aria-hidden="true" ></span></button>');
                $("#cntBotonesAcciones").append('<span>&nbsp;&nbsp;</span>');
                $("#cntBotonesAcciones").append(lnkpedidoventa);
                $("#cntBotonesAcciones").append('<span>&nbsp;&nbsp;</span>');
                $("#cntBotonesAcciones").append('<button type="button" id="btn_87sda987fa9sdfjkk" class="btn btn-default" onclick="fnMostrarImagenOportunidad('+prospectoid+');" data-toggle="tooltip" data-placement="right" title="Ver Imagenes"><span class="glyphicon glyphicon-picture" aria-hidden="true"></span></button>');

                if(!arrEstatus.includes(row.idstatus)){
                    if (row.permisocambioetapa) {
                        $("#cntBotonesAcciones").append('<span>&nbsp;&nbsp;</span>');
                        $("#cntBotonesAcciones").append('<button type="button" class="btn btn-info" onclick="fnCambiarEtapa('+prospectoid+', '+row.idstatus+', '+row.vendedorid+', \''+row.fecha_cierre+'\');" data-toggle="tooltip" data-placement="right" title="Cambiar Etapa">'+
                                                            '<span class="glyphicon glyphicon-retweet" aria-hidden="true"></span>'+
                                                        '</button>');
                    }
                }

                if (row.permisoCambioFechaCierre) {
                    $("#cntBotonesAcciones").append('<span>&nbsp;&nbsp;</span>');
                    $("#cntBotonesAcciones").append('<button type="button" class="btn btn-warning" onclick="fnAbrirSoloFechaCierre(' + prospectoid + ', \'' + row.fecha_cierre + '\');" data-toggle="tooltip" data-placement="right" title="Cambiar Fecha de Cierre"><span class="glyphicon glyphicon-calendar" aria-hidden="true"></span></button>');
                }

                if (row.archivos > 0){
                    $("#btn_87sda987fa9sdfjkk").removeClass("btn-default");
                    $("#btn_87sda987fa9sdfjkk").addClass("btn-success");
                }
                
                // barras de porcentaje por etapa
                if (typeof(row.estatus) == "object"){
                    fechaini= "";
                    fechafin= "";

                    $.each(row.estatus, function(indact, rowact) {
                        totaldias= rowact.totaldias;
                        bordeinicial= "";

                        if (fechaini == ""){
                            fechaini= moment(rowact.fecha_alta);
                            bordeinicial= "border-radius: 10px 0px 0px 10px;"
                        }

                        fechafin= moment(rowact.fechamovto);
                        //diferenciadias= fechafin.diff(fechaini, "days") == 0 ? 1 : fechafin.diff(fechaini, "days");
                        diferenciadias= fechafin.diff(fechaini, "days");
                        porcentajedias= (diferenciadias / parseInt(totaldias))*100;

                        if (rowact.idstatus_ant == 0){
                            diasenbasededatos= diferenciadias;
                        }

                        barraetapa+= '<div id="pb_'+rowact.id+'" style="text-align: center; color:white; background-color: '+rowact.color_ant+';width: '+porcentajedias+'%;padding-top: 3px; '+bordeinicial+'"><span>'+diferenciadias+'d</span></div>';
                        
                        barraiconos+='<div class="text-center" style="width: '+porcentajedias+'%;">'+
                                        '<img id="img_'+rowact.id+'" width="20" height="20" src="images/'+rowact.icono_ant+'" border="0">'+
                                      '</div>';

                        fechaini= moment(rowact.fechamovto);
                        coloretapa= rowact.color_act;
                        iconofinal= rowact.icono_act;
                    });

                    fechafin= moment(new Date());
                    diferenciadias= fechafin.diff(fechaini, "days") == 0 ? 1 : fechafin.diff(fechaini, "days");
                    porcentajedias= (diferenciadias / parseInt(totaldias))*100;

                    barraetapa+= '<div id="pb_final" style="text-align: center; color:white; background-color: '+coloretapa+';width: '+porcentajedias+'%;padding-top: 3px;"><span>'+diferenciadias+'d</span></div>';

                    barraiconos+='<div class="text-center" style="width: '+porcentajedias+'%;">'+
                                    '<img id="img_final" width="20" height="20" src="images/'+iconofinal+'" border="0">'+
                                 '</div>';
                }

                $("#progresos").append(barraetapa);
                $("#progresos2").append(barraiconos);
                $("#totaldias").text((totaldias-diasenbasededatos)+"d"); 

                var renglones="";
                
                // ciclo para llenar tabla de actividades 
                if (typeof(row.actividades) == "object"){
                    $.each(row.actividades, function(indact, rowact) {
                        ultimarespuesta= "";
                        doblerenglon= "";
                        fechaini="";
                        fechafin="";
                        iconofinal= "";
                        coloretapa="";
                        var fecharespuesta="";

                        var colorrenglon="";
                        var iconocalifica= '<span class="glyphicon glyphicon-ok-circle" aria-hidden="true" style="background-color: green; color: white; font-size: 25pt; border-radius: 20px;"></span>';

                        if (typeof(row.estatus) == "object"){
                            $.each(row.estatus, function(indest, rowest) {
                                if (fechaini == ""){
                                    fechaini= Date.parse(rowest.fecha_alta);
                                }

                                fechafin= Date.parse(rowest.fechamovto);

                                if (Date.parse(rowact.fecha_seguimiento) >= fechaini && Date.parse(rowact.fecha_seguimiento) < fechafin){
                                    if (rowest.idstatus_ant == 0){
                                        iconofinal= '<img id="img_'+rowest.id+'" width="25" height="25" src="images/'+rowest.icono_ant+'" border="0">';
                                    } else {
                                        iconofinal= '<span class="glyphicon glyphicon-user" aria-hidden="true" style="background-color: '+rowest.color_ant+';color: white;padding: 8px;border-radius: 20px;"></span>';
                                    }
                                }

                                fechaini= Date.parse(rowest.fechamovto);
                                coloretapa= rowest.color_act;
                            });

                            if (iconofinal == ""){
                                iconofinal= '<span class="glyphicon glyphicon-user" aria-hidden="true" style="background-color: '+coloretapa+';color: white;padding: 8px;border-radius: 20px;"></span>';
                            }
                        }

                        // validar que sea la ultima activdad registrada
                        var fechaactividad= new Date(rowact.fecha_seguimiento);
                        var fechaactual= new Date();
                        
                        fechaactividad.setHours(0,0,0,0);
                        fechaactual.setHours(0,0,0,0);

                        if (typeof(row.comentarios) != 'undefined'){
                            if (typeof(row.comentarios[rowact.actividad_id]) == "object"){
                                fecharespuesta= new Date(row.comentarios[rowact.actividad_id][0].fecha);
                                fecharespuesta.setHours(0,0,0,0);

                                ultimarespuesta= '<br><span style="color: blue; font-style: italic;">'+row.comentarios[rowact.actividad_id][0].comentario+'</span><br>'+
                                                 '<span style="color: lightslategray;">Fecha: '+row.comentarios[rowact.actividad_id][0].fecha+'</span><br>'+
                                                 '<span style="color: lightslategray;">Usuario: '+row.comentarios[rowact.actividad_id][0].usuario_comentario+'</span>';
                                
                                if (actividadvencida == 0 && renglones == ""){
                                    actividadvencida=2;
                                }
                            }
                        }

                        // si es la ultima actividad agregar icono de calificacion
                        if ((fechaactividad < fechaactual && ultimarespuesta == "") || (fecharespuesta > fechaactividad)){
                            colorrenglon= "background-color: #ffc9c9;"; 
                            iconocalifica= '<span class="glyphicon glyphicon-remove-circle" aria-hidden="true" style="background-color: red; color: white; font-size: 25pt; border-radius: 20px;"></span>';
                            actividadvencida=1; 
                        }

                        if (ultimarespuesta == ""){
                            mostrarrespuesta='<br><div class="input-group hide" id="cntRespuesta_'+rowact.actividad_id+'" style="width: 100%;">'+
                                                    '<span class="input-group-addon" id="sizing-addon2">Respuesta:</span>'+
                                                    '<textarea id="txtRespuesta_'+rowact.actividad_id+'" class="form-control" style="resize: none;" rows="3"></textarea>'+
                                                    '<span class="input-group-btn">'+
                                                        '<button class="btn btn-primary btnAgregarComentarioNuevo" data-actividad="'+rowact.actividad_id+'" data-prospectoid="'+prospectoid+'" data-nombre="'+row.prospecto+'" data-vendedorid="'+row.vendedorid+'" style="height: 74px;">Guardar</button>'+
                                                    '</span>'+
                                                '</div>'+
                                                '<div class="hide" style="margin-top: 5px;" id="cntContacto_'+rowact.actividad_id+'">'+
                                                '<label>¿Se contacto al responsable de la toma de decisión?<span style="color:red;">*</span></label>'+
                                                '<div>'+
                                                '<label>Si </label><input id="siContacto" class="contactoCheckbox" type="checkbox" style="margin-right:22px;" value="2"><label>No </label><input id="noContacto" class="contactoCheckbox" type="checkbox" value="1">'+
                                                '</div>'+
                                                '</div>';
                        }

                        renglones+="<tr id='rowActividad_"+rowact.actividad_id+"' style='"+colorrenglon+"'>";
                            renglones+="<td class='text-center' "+doblerenglon+" nowrap style='vertical-align: middle;'>"+rowact.fecha_seguimiento+"</td>";
                            renglones+='<td '+doblerenglon+' style="vertical-align: middle;"><img width="20" height="20" src="images/'+ rowact.iconodia +'" border="0">&nbsp;'+rowact.tipo_actividad+"</td>";
                            renglones+="<td><b>"+rowact.descripcion_actividad+"</b>"+ultimarespuesta+mostrarrespuesta+"</b></td>";
                            renglones+="<td style='text-align: center;'>"+iconocalifica+"</td>";  // calificacion de la actividad
                            renglones+="<td style='text-align: center; padding-top: 12px;'>"+iconofinal+"</td>"; // etapa que estaba en ese momento de la actividad

                            // celda para iconos de acciones
                            renglones+="<td style='text-align: center;' nowrap>";

                            // si no se tiene una respuesta muestra el boton
                            if (ultimarespuesta == ""){

                                renglones+='<button id="btnModificarActividad_'+rowact.actividad_id+'" type="button" class="btn btn-default btn-xs btn-primary" data-actividad="'+rowact.actividad_id+'" style="margin-top: 4px;" onclick="fnModificaNuevaActividad('+rowact.actividad_id+');">'+
                                                '<span class="glyphicon glyphicon-edit" aria-hidden="true"></span>'+
                                            '</button>&nbsp;&nbsp;';

                                renglones+='<button id="btnAgregaRespuesta_'+rowact.actividad_id+'" type="button" class="btn btn-default btn-xs btn-primary btnAgregaRespuesta" data-actividad="'+rowact.actividad_id+'" style="margin-top: 4px;">'+
                                                '<span class="glyphicon glyphicon-comment" aria-hidden="true"></span>'+
                                            '</button>';

                                /*mostrarrespuesta='<div class="input-group hide" id="cntRespuesta_'+rowact.actividad_id+'" style="width: 100%;">'+
                                                    '<span class="input-group-addon" id="sizing-addon2">Respuesta:</span>'+
                                                    '<textarea id="txtRespuesta_'+rowact.actividad_id+'" class="form-control" style="resize: none;" rows="3"></textarea>'+
                                                    '<span class="input-group-btn">'+
                                                        '<button class="btn btn-primary btnAgregarComentarioNuevo" data-actividad="'+rowact.actividad_id+'" data-prospectoid="'+prospectoid+'" data-nombre="'+row.prospecto+'" style="height: 74px;">Guardar</button>'+
                                                    '</span>'+
                                                '</div>';*/
                            }

                            renglones+="</td>"; 

                            renglones+="<td>"+rowact.usuario_actividad+"</td>";
                        renglones+="</tr>";
                        
                        /*if (ultimarespuesta != ""){
                            renglones+="<tr id='rowComentario_"+rowact.actividad_id+"' class='tienerespuesta'>";
                                renglones+="<td colspan=5 style='color: blue; font-style: italic;'>"+
                                                ultimarespuesta+
                                            "</td>";
                            renglones+="</tr>";
                        } else {
                            renglones+="<tr id='rowComentario_"+rowact.actividad_id+"' class='hide'>";
                                renglones+="<td colspan=2></td>";
                                renglones+="<td colspan=5>"+
                                                mostrarrespuesta+
                                            "</td>";
                            renglones+="</tr>";
                        }*/
                    });
                }

                $("#tbInfoActividades").append(renglones);

                // si la ultima actividad esta vencida y tiene una respuesta se muestra el mmodal para que se genere nueva actividad
                if (actividadvencida == 2){
                    fnGeneraNuevaActividad(prospectoid, $("#lblInfoProspecto").text(), row.vendedorid, false);
                } else if(row.idstatus == 0){
                    fnGeneraNuevaActividad(prospectoid, $("#lblInfoProspecto").text(), row.vendedorid, false);
                }

            });
        }
    } catch (excepcion) {
        console.log("error en la ejecucion: "+excepcion);
    }
}

// Funcion para traer los registros historicos de la oportunidad
function fnTraeHistorial(movimiento){
    var fd = new FormData();
    fd.append("option","traeHistorial");
    fd.append("idOportunidad", movimiento);

    var data = fnAjaxGeneral("", "POST", fd);

    $("#tablaHistorial tbody").empty();

    if(data.result){
        var renglones="";

        $.each(data.contenido, function(ind, row) {
            renglones+="<tr id='rowActividad_"+row.idactividad+"'>";
            renglones+="<td class='text-center' nowrap>"+row.fecha+"</td>";
            renglones+="<td>"+row.tipo+"</td>";
            renglones+="<td>"+row.titulo+"</td>";
            renglones+="<td>"+row.descripcion+"</td>";
            renglones+="<td class='text-center'>"+row.usuario+"</td>";
            renglones+="<td><button class='btn btn-default btn-sm btnRespuestaComentario' data-actividad='"+row.idactividad+"'><span class='glyphicon glyphicon-menu-down' aria-hidden='true'></span></button></td>";
            renglones+="</tr>";

            renglones+="<tr id='rowComentario_"+row.idactividad+"' class='hide'>";
            renglones+="<td colspan=5>";
            renglones+="<table class='table'>";
            renglones+="<thead>";
            renglones+="<tr>";
            renglones+="<td style='background-color:#F3E2A9;' class='text-center'>Fecha</td>";
            renglones+="<td style='background-color:#F3E2A9;' class='text-center'>Respuesta</td>";
            renglones+="<td style='background-color:#F3E2A9;' class='text-center'>Usuario</td>";
            renglones+="</tr>";
            renglones+="</thead>";
            renglones+="<tbody>";
            $.each(row.comentarios, function(ind2, row2) {
                renglones+="<tr>";
                renglones+="<td class='text-center'>"+row2.fecha+"</td>";
                renglones+="<td class='text-left'>"+row2.comentario+"</td>";
                renglones+="<td class='text-center'>"+row2.usuario+"</td>";
                renglones+="</tr>";
            });
            renglones+="</tbody>";
            
            renglones+="<tfoot>";
            renglones+="<tr class='text-center'>";
            renglones+="<td colspan=2><input type='text' class='form-control input-sm' id='inputComentario_"+row.idactividad+"' /></td>";
            renglones+="<td><button class='btn btn-sm btn-primary btnAgregarComentario' data-actividad='"+row.idactividad+"'>Enviar</button></td>";
            renglones+="</tr>";
            renglones+="</tfoot>";
            renglones+="</table>";
            renglones+="</td>";
            renglones+="</tr>";
        });
        
        $("#tablaHistorial tbody").html(renglones);

        let fecha_ultima_actividad = $('#tablaHistorial tbody tr').children(':first').html();
        var fecha = new Date(fecha_ultima_actividad +" 23:59:59");
        var fecha_actual = new Date();
        if(fecha<fecha_actual){
            $('#tablaHistorial tbody').find("tr").eq(0).css("background-color","lightcoral");
            $('#tablaHistorial tbody').find("tr").eq(0).css("color","white");
        }else if(fecha == fecha_actual){
            $('#tablaHistorial tbody').find("tr").eq(0).css("background-color","#fff8d3");
        }

    }

    //$("#modalhistorial").modal("show");
}

// Funcion para actualizar vendedor
function fnActualizaVendedor(){

    if($("#cmbVendedor02").val()=="" || $("#cmbVendedor02").val()==null){
        fnAlertaGeneral("Validación","Es necesario seleccionar un vendedor", "warning");
        return false;
    }

    var fd = new FormData(document.getElementById("formVendedor"));
    fd.append("option","actualizaVendedor");

    var data = fnAjaxGeneral("", "POST", fd);

    if(data.result){
        $("#mensajevendedor").text("Se guardo vendedor correctamente");
        $("#msjVendedor").removeClass("hide");
        let vendedor = $('select[name="cmbVendedor02"] option:selected').text();
        $("#lblVendedorMap"+$("#txtMovimientoVendedor").val()).text(vendedor);
    }
}

// Funcion para actualizar vendedor
function fnGuardaPoligono(){
    var fd = new FormData();
    fd.append("datos", JSON.stringify(arrDatosPoligono));
    fd.append("option","actualizaPoligono");

    var data = fnAjaxGeneral("", "POST", fd);

    if(data.result){
        $("#lblMensajePoligono").text("Se guardo correctamente");
        $("#lblMensajePoligono").removeClass("hide");
    }
}

function fnCoincidenciasProspecto(){
    if( $("#aPaterno").val()==""){
        return false;
    }
    
    var fd = new FormData();
    fd.append("nombre_prospecto", $("#aPaterno").val());
    fd.append("option","CoincidenciasProspecto");

    var data = fnAjaxGeneral("", "POST", fd);

    if($('#tblCoincidenciasProspecto').DataTable().data().length > 0){
        $('#tblCoincidenciasProspecto').DataTable().clear();
        $('#tblCoincidenciasProspecto').DataTable().draw();
    }

    if(data.result){
        if(Object.keys(data.contenido).length >0){
            $.each(data.contenido, function(index, el) {
                $('#tblCoincidenciasProspecto').dataTable().fnAddData( 
                    [
                        "<button id='btnSeleccionar' class='btn btn-primary btn-sm' onclick='fnSeleccionaProspectoExistente("+JSON.stringify(el)+");'>Seleccionar</button>",
                        '<span id="spNombreProspectoExistente">['+el.debtorno+'] '+el.name+'</span>',
                        el.fecha,
                        el.userprospect
                    ]
                );
            });
            
            $("#mdlCoincidenciasProspecto").modal("show");
        };
    }
}

function fnSeleccionaProspectoExistente(elemento){
    try {
        $("#idProspecto").val(elemento.debtorno);
        $("#lblProspectoId_Existente").text(elemento.debtorno);
        $("#lblProspectoId_Existente").val(elemento.debtorno);
        $("#aPaterno").val(elemento.name);
        
        $("#SectComClId").val(elemento.SectComClId);
        $("#SectComClId").multiselect("rebuild");
        
        $("#email_pros").val(elemento.email);
        $("#telefonoFijo_pros").val(elemento.telefono_fijo);
        $("#cp_pros").val(elemento.cp);
        
        $("#estado_pros").val(elemento.estado);
        $("#estado_pros").multiselect("rebuild");

        $("#ciudad_pros").val(elemento.ciudad);
        $("#colonia_pros").val(elemento.colonia);
        $("#direccion_pros").val(elemento.direccion);

        $("#CustLeadSourceId").val(elemento.CustLeadSourceId); 
        $("#CustLeadSourceId").multiselect("rebuild");

        $("#mdlCoincidenciasProspecto").modal("hide");

    } catch (excepcion) {
        console.log("Error: "+excepcion);
    }
}

function fnObtenerDireccion(){
    /*//Seccion para determinar la distancia entre dos puntos
    const service = new google.maps.DistanceMatrixService();
    const origen = { lat: 20.62628778309058, lng: -100.30645952218278};
    const destino = { lat: 20.53650573805582, lng: -100.41599843592925 };

    const request = {
        origins: [origen],
        destinations: [destino],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
    };

    // get distance matrix response
    service.getDistanceMatrix(request).then((response) => {
        // put response
        document.getElementById("txtRespuestaRuta").innerText = JSON.stringify(response, null, 2);
        //response.rows[0].elements[0].distance.value
    });*/
}

function fnEliminaImagen(idarchivo, idoportunidad, sufijoid=''){
    try{
        var fd = new FormData();

        fd.append("option","EliminarImagen");
        fd.append("idarchivo", idarchivo);
        fd.append("idoportunidad", idoportunidad);

        var data = fnAjaxGeneral("", "POST", fd);
        
        if(data.result){
            fnAlertaGeneral("Exito","Imagen eliminada correctamente", "success");
            fnMostrarImagenOportunidad(idoportunidad, sufijoid);
        } else {
            fnAlertaGeneral("Error","Problema al eliminar la imagen", "error");
        }

    } catch (excepcion) {
        console.log("Error al eliminar imagen: "+excepcion);
    }
}

/**
 * Función para alertas y mensajes
 * Ejemplo: fnAlertaGeneral('Información!', '', 'success');
 * @param  {String} title Titulo
 * @param  {String} text  Descripción
 * @param  {String} type  Tipo: success, info, warning
 * @return {[type]}       [description]
 */
function fnAlertaGeneral(title = 'Información!', text = '', type = 'success') {
	swal({
		title: title,
		text: text,
		type: type
	});
}

function valideKey(evt){
    // code is the decimal ASCII representation of the pressed key.
    var code = (evt.which) ? evt.which : evt.keyCode;
    
    if(code==8) { // backspace.
      return true;
    } else if(code>=48 && code<=57) { // is a number.
      return true;
    }else if(code==46) { // punto.
        return true;
    } else{ // other keys.
      return false;
    }
}

/**
 * Función para darle formato a la tabla y nombre de archivo de descarga
 * @param  {[type]} idTable       Id o clase de la tabla
 * @param  {String} nombreArchivo Nombre para descarga
 * @return {[type]}               [description]
 */
function fnFormatoTablaGeneralBasico(idTable, nombreArchivo = '', alingCenter = [], alingRight = [], totalTabla = [], hiddenColumns = [], colorRow = [], searching=false) {
	if (nombreArchivo=="") {
		nombreArchivo = 'Información Exportada';
	}

    var table =	$(idTable).DataTable({
        dom: '<"html5buttons"B>lTfgitp',
        buttons: [
            { extend: 'copy', title: nombreArchivo },
			{ extend: 'csv', title: nombreArchivo },
			{ extend: 'excel', title: nombreArchivo },
        ],
        "searching": searching,
        info: false,
        ordering: false,
        paging: false,
        "language": {
			"sSearch": "Buscar:",
			"oPaginate": {
				"sFirst": "Primero",
				"sLast": "Último",
				"sNext": "Siguiente",
				"sPrevious": "Anterior"
			},
			"sInfo": "Mostrando  del _START_ al _END_ de _TOTAL_ registros",
			"sLengthMenu": "Mostrar _MENU_ registros",
			"buttons": {
				"copy": "Copiar",
				"colvis": "Visibilidad",
				"print": "Imprimir"
			}
		},
        columnDefs: [
            { className: 'text-left', targets: alingRight },
            { className: 'text-center', targets: alingCenter },
        ],
    });

	return table;
}

function fnMostrarCoordenadaMapa(oportunidad, latitud, longitud){
    try {
        const position = { lat: latitud, lng: longitud };

        openNav();
        $("#contenedornotificaciones").empty();
        $("#lblTituloNotificaciones").html('<label>Ubicacion Oportunidad</label>&nbsp;&nbsp;&nbsp;<span class="glyphicon glyphicon-refresh" aria-hidden="true" style="cursor: pointer;" onclick="fnMostrarCoordenadaMapa('+oportunidad+','+latitud+','+longitud+');"></span>');
        $("#contenedornotificaciones").append('<div id="mapa_oportunidad" style="height: 100%;"></div>');

        //const {AdvancedMarkerElement} = await google.maps.importLibrary("marker");

        const mapOportunidad = new google.maps.Map(document.getElementById("mapa_oportunidad"), {
            center: new google.maps.LatLng(latitud, longitud),
            zoom: 17,
            clickableIcons: false,
            mapId: "mapUbicaOporunidad_32423sdf"
        });

        const ubicacion = new google.maps.marker.AdvancedMarkerElement({
            map: mapOportunidad,
            position: position,
            title: 'Ubicacion Oportunidad',
        });

        // construye DIV de respuesta
        let ventana= '<div id="ventanadatos" class="ventanita" style="text-align: left;">'+
                        '<header style="border: 1px solid blue;border-bottom: 1px solid lightgray;border-left: 0px;border-top: 0px;border-right: 0px;">'+
                            '<image width=30 height=30 src="images/logoconstramos.png" border="0"></image>'+
                            '&nbsp;&nbsp;&nbsp;<label>Datos de prospecto</label>'+
                        '</header>'+
                        '<br>'+
                        '<label>Prospecto: &nbsp;</label>['+oportunidad+']'+$("#lblNombreProspecto_"+oportunidad).text()+
                        '<br>'+
                        '<label>Vendedor: &nbsp;</label>'+$("#lblNombreVendedor_"+oportunidad).text()+
                        '<br>'+
                        '<label>Direccion: &nbsp;</label>'+$("#lblDireccionProspecto_"+oportunidad).text()+
                        '<br>'+
                    '</div>';
        
        const infowindow = new google.maps.InfoWindow({
            content: ventana,
        });

        infowindow.open(mapOportunidad, ubicacion);
        
    } catch (excepcion) {
        console.log("Error al mostrar mapa: "+excepcion);
    }
}

function actualizarEstatusProspec(idEstatus, idOportunidad){
    var fd = new FormData();

    fd.append("option", "actualizarEstatus");
    fd.append("idEstatus", idEstatus);
    fd.append("idOportunidad", idOportunidad);

    var respuesta = fnAjaxGeneral("", "POST", fd);

    if(respuesta.result){
        // console.log("Se actualizo el estatus con exito");
    }else{
        // console.log("Hubo un error");
    }
}

function mostrarProspectoMapa(idOportunidad){
    var fd = new FormData();
    
    fd.append("option", "iconoMapaEstatus");
    fd.append("idOportunidad", idOportunidad);
    
    var data = fnAjaxGeneral("", "POST", fd);
    
    if (data.result) {
        $("#idOportunidad").val(idOportunidad);
        $("#u_movimientoID").val(idOportunidad);
        $.each(data.result, function(ind, row) {
            refreshMapBase(row.link_google_map, row.name, row.debtorno, row.logo, row.direccion, row.vendedor);
        });
    }
}

let mapNavegacion;

setTimeout(() => {
    initMap1();
  }, "6000");

function initMap1() {
    mapNavegacion = new google.maps.Map(document.getElementById("mapNavegacion"), {
        center: new google.maps.LatLng(20.563763, -100.412788),
        zoom: 15,
        clickableIcons: false,
        mapId: "mapaOportunidades_asdf435435sff"
    });
    
    const centerButton = bottonCentralControl(mapNavegacion);
    const centerButtonDiv = document.createElement("div");
    centerButtonDiv.id="divPoligonos";
    centerButtonDiv.style.paddingTop="10px";
    centerButtonDiv.appendChild(centerButton);

    mapNavegacion.controls[google.maps.ControlPosition.TOP_LEFT].push(
        centerButtonDiv
    );

    obtenerUbicacionActual();
}

function bottonCentralControl () {
    const gpsButton = document.createElement("button");

    gpsButton.classList.add('btn');
    gpsButton.classList.add('btn-default');

    gpsButton.innerHTML = '<img src="./images/zona.png" style="height: 100%; width: auto;">'
    gpsButton.title = "Trazar ruta";
    gpsButton.type = "button";
    gpsButton.id="gps_ubicacion";
    gpsButton.style.height="42px";

    gpsButton.addEventListener('click', (elemento => {
        trazarRutaMapa(mapNavegacion);
    }));
    
    return gpsButton;
}

let directionsRendererNavegacion;

function trazarRutaMapa(tipoMapa) {
    let fechaSeleccionada; 
    tipoMapa == mapNavegacion ? fechaSeleccionada = $("#txtFechaActividadNuevo").val() : fechaSeleccionada = $("#txtAnioInicio").val()+"-0"+$("#cmbMesInicio").val()+"-"+$("#cmbDiaInicio").val();
    const vendedor = $("#cmbComisionista").val(); 
    let puntosruta = [];
    let prospecto = [];

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const origen = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

                if(vendedor == null) {
                    fnAlertaGeneral("Vendedor", "Selecciona un vendedor", "info");
                    return; 
                }

                var fd = new FormData();
                fd.append("option", "actividadMapa");
                fd.append("fechaActividad", fechaSeleccionada);
                fd.append("vendedor", vendedor[0]);

                var data = fnAjaxGeneral("", "POST", fd);

                if (data.result) {
                    $("#idOportunidad").val(idOportunidad);
                    $("#u_movimientoID").val(idOportunidad);
                    $.each(data.result, function(ind, row) {
                        if(row.coordenadas != ""){
                            const coordenadaslatlong = row.coordenadas;
                            const coordenadas = coordenadaslatlong.split(",");
                            const nombre = row.name;
                            
                            puntosruta.push({
                                location: new google.maps.LatLng(coordenadas[0], coordenadas[1]),
                                stopover: true
                            });
                            prospecto.push({ nombre: nombre });
                        }
                    });

                    if (puntosruta.length < 1) {
                        return fnAlertaGeneral("SIN RUTA", "Registra un destino", "info");
                    }

                    const destino = puntosruta[puntosruta.length - 1].location;
                    puntosruta.pop();
                    
                    const directionsServiceNavecion = new google.maps.DirectionsService();

                    if (directionsRendererNavegacion) {
                        directionsRendererNavegacion.setMap(null);
                    }

                    directionsRendererNavegacion = new google.maps.DirectionsRenderer();
                    directionsRendererNavegacion.setMap(tipoMapa);

                    trazarRutaG(directionsRendererNavegacion, directionsServiceNavecion, origen, destino, "DRIVING", puntosruta, prospecto, tipoMapa);
                }
            },
            function(error) {
                alert("Error al obtener la geolocalización: " + error.message);
            }
        );
    } else {
        alert("La geolocalización no está soportada por este navegador.");
    }
}

function rutaRealVehiculo(map){
    const vendedor = $("#cmbComisionista").val();
    const fechaSeleccionada = $("#txtAnioInicio").val()+"-0"+$("#cmbMesInicio").val()+"-"+$("#cmbDiaInicio").val();

    if(vendedor == null) {
        fnAlertaGeneral("Vendedor", "Selecciona un vendedor", "info");
        return; 
    }
    
    var fd = new FormData();
    fd.append("option", "rutaReal");
    fd.append("fechaActividad", fechaSeleccionada);
    fd.append("vendedor", vendedor[0]);

    var data = fnAjaxGeneral("", "POST", fd);

    coordinates = data.result;

    if(coordinates[0] == undefined){
        fnAlertaGeneral("Sin ruta", "El vendedor no tiene una ruta registrada", "info");
        return;
    }
    
    const routePath = new google.maps.Polyline({
        path: coordinates,
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2,
    });

    routePath.setMap(map);
}

function indiceALetra(index) {
    return String.fromCharCode(65 + index);
}

function trazarRutaG(directionsRenderer, directionsService, origen, destino, tipo, waypts, prospecto, tipoMapa){
    try {
        directionsService.route({
            origin: origen,
            destination: destino,
            waypoints: waypts,
            optimizeWaypoints: true,
            travelMode: google.maps.TravelMode[tipo],
        })
        .then((response) => {
            directionsRenderer.setDirections(response);

            const route = response.routes[0];

            // Agregar cuadro de informacion para la ruta
            const cuadroruta = document.getElementById("cuadroruta");
            const input = document.getElementById("pac-input");
            tipoMapa.controls[google.maps.ControlPosition.LEFT_TOP].clear();
            tipoMapa.controls[google.maps.ControlPosition.LEFT_TOP].push(input);
            tipoMapa.controls[google.maps.ControlPosition.LEFT_TOP].push(cuadroruta);
            const detalleruta = document.getElementById("detalleruta");
            const kilometros= document.getElementById("spKilometros");
            var totalkilometros=0;
            
            tipoMapa == mapNavegacion ? $("#detalleruta").width('144px') : $("#detalleruta").width('240px');
            detalleruta.innerHTML = "";
            let p = 0;

            // For each route, display summary information.
            for (let i = 0; i < route.legs.length; i++) {
                let letra = indiceALetra(p + 1);
                detalleruta.innerHTML += "<b>" + "["+ [letra] + "] " + prospecto[i].nombre + "</b><br>";
                detalleruta.innerHTML += route.legs[i].end_address + "<br>"
                detalleruta.innerHTML += "Distancia: " + route.legs[i].distance.text +"<br>";
                detalleruta.innerHTML += " Tiempo: " + route.legs[i].duration.text + "<br><br>";
                totalkilometros+= route.legs[i].distance.value;
                p ++;
            }

            kilometros.innerHTML= (totalkilometros/1000).toFixed(1).toString()+" km";
        })
        .catch((excepcion) =>
            window.alert("La solicitud de ruta tuvo un problema: " + excepcion)
        );
    } catch (error) {
        window.alert("La solicitud de ruta tuvo un problema: " + error)
    }
}

function obtenerUbicacionActual(){     

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                var imagen = document.createElement("img");
                imagen.src= "./images/car_sev2.ico";
                imagen.width="50";
                imagen.height="60";

                // Marca de planta de emulsiones
                const usuario= new google.maps.marker.AdvancedMarkerElement({
                    position: new google.maps.LatLng(pos.lat, pos.lng),
                    content: imagen,
                    map: mapNavegacion
                });
                
                attachSecretMessage(usuario, $("#txtUsuario").val());
            },
            () => {
                handleLocationError(true, infoWindow, map.getCenter());
            }
        );
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

function attachSecretMessage(marker, secretMessage) {
    const infowindow = new google.maps.InfoWindow({
        content: secretMessage,
    });
  
    marker.addListener("click", () => {
        infowindow.open(marker.map, marker);
    });
}

function changeTab(element, tabName) {
    $('.nav-tabs li').removeClass('active');
    $(element).parent().addClass('active');
    $('.tab-content').removeClass('active');
    $('#' + tabName).addClass('active');
}

function fnAbrirSoloFechaCierre(prospectoid, fechaCierreActual) {
    $('#mdlSoloFechaCierre').remove();
    var html = '<div class="modal fade" id="mdlSoloFechaCierre" tabindex="-1" role="dialog">'
        + '<div class="modal-dialog" role="document">'
        + '<div class="modal-content">'
        + '<div class="modal-header"><h4 class="modal-title">Cambiar Fecha de Cierre</h4></div>'
        + '<div class="modal-body">'
        + '<div class="form-group">'
        + '<label>Nueva fecha de cierre</label>'
        + '<input type="date" id="inputNuevaFechaCierre" class="form-control" value="' + fechaCierreActual + '">'
        + '</div>'
        + '</div>'
        + '<div class="modal-footer">'
        + '<button type="button" class="btn btn-default" data-dismiss="modal">Cancelar</button>'
        + '<button type="button" class="btn btn-primary" onclick="fnGuardarSoloFechaCierre(' + prospectoid + ')">Guardar</button>'
        + '</div>'
        + '</div></div></div>';
    $('body').append(html);
    $('#mdlSoloFechaCierre').css('z-index', '99999');
    $('#mdlSoloFechaCierre').on('shown.bs.modal', function() {
        $('.modal-backdrop').last().css('z-index', '99998');
    });
    $('#mdlSoloFechaCierre').modal('show');
}

function fnGuardarSoloFechaCierre(prospectoid) {
    var nuevaFecha = $('#inputNuevaFechaCierre').val();
    if (!nuevaFecha) {
        alert('Selecciona una fecha');
        return;
    }
    var fd = new FormData();
    fd.append('option', 'GuardarSoloFechaCierre');
    fd.append('u_movimiento', prospectoid);
    fd.append('fecha_cierre', nuevaFecha);
    $.ajax({
        url: 'modelo/ProspectV2Modelo.php',
        type: 'POST',
        data: fd,
        processData: false,
        contentType: false,
        success: function(resp) {
            var r = typeof resp === 'string' ? JSON.parse(resp) : resp;
            if (r.result) {
                $('#mdlSoloFechaCierre').modal('hide');
                $('#mdlSoloFechaCierre').remove();
                $('.modal-backdrop').remove();
                $('body').removeClass('modal-open');
                fnAlertaGeneral('Correcto', 'Fecha de cierre actualizada', 'success');
            } else {
                fnAlertaGeneral('Error', r.msjError || 'No se pudo guardar', 'error');
            }
        },
        error: function() {
            alert('Error de comunicacion');
        }
    });
}
