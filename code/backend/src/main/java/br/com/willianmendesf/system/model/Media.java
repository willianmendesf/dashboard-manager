package br.com.willianmendesf.system.model;

import lombok.Data;

@Data
public class Media {
    private String base64;      // Dados da mídia em base64
    private String mimetype;    // Tipo MIME, ex: image/jpeg
    private String filename;    // Nome do arquivo (opcional) / local do arquivo
}