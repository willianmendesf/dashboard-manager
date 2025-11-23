package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisitorGroupRequestDTO {
    private CreateVisitorDTO mainVisitor;
    private List<AccompanyingVisitorDTO> accompanyingVisitors;
}

